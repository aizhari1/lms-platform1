import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ExamAttemptStatus,
  GradingStatus,
  QuestionType,
  Role,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { SubmitExamAttemptDto, ManualGradeAnswerDto } from './dto/exam-attempt.dto';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@Injectable()
export class ExamAttemptsService {
  constructor(private readonly prisma: PrismaService) {}

  // -----------------------------------------------------------------
  // START ATTEMPT
  // -----------------------------------------------------------------
  async startAttempt(studentId: string, examId: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: { questions: { include: { choices: true } } },
    });
    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    const previousAttempts = await this.prisma.examAttempt.count({
      where: { examId, studentId },
    });
    if (previousAttempts >= exam.maxAttempts) {
      throw new BadRequestException(
        `You have reached the maximum number of attempts (${exam.maxAttempts}) for this exam`,
      );
    }

    // Prevent multiple concurrent in-progress attempts
    const inProgress = await this.prisma.examAttempt.findFirst({
      where: { examId, studentId, status: ExamAttemptStatus.IN_PROGRESS },
    });
    if (inProgress) {
      return this.getAttemptWithQuestions(inProgress.id, exam);
    }

    let questionPool = exam.questions;
    if (exam.questionsToPick && exam.questionsToPick < questionPool.length) {
      questionPool = this.pickRandom(questionPool, exam.questionsToPick);
    }
    if (exam.randomizeOrder) {
      questionPool = this.shuffle(questionPool);
    }

    const attempt = await this.prisma.examAttempt.create({
      data: {
        examId,
        studentId,
        status: ExamAttemptStatus.IN_PROGRESS,
        scoreTotal: questionPool.reduce((sum, q) => sum + Number(q.points), 0),
      },
    });

    return {
      attemptId: attempt.id,
      durationMin: exam.durationMin,
      startedAt: attempt.startedAt,
      questions: questionPool.map((q) => ({
        id: q.id,
        type: q.type,
        textAr: q.textAr,
        points: q.points,
        // Never leak `isCorrect`/`matchValue` to the client while the exam
        // is active. Choices are shuffled per attempt so their position
        // isn't memorizable across students/attempts.
        choices: this.shuffle(q.choices).map((c) => ({ id: c.id, textAr: c.textAr })),
        // MATCHING: the pool of right-side answers the student picks from,
        // shuffled separately so it doesn't mirror the left-side order.
        ...(q.type === QuestionType.MATCHING
          ? { matchOptions: this.shuffle(q.choices.map((c) => c.matchValue!)) }
          : {}),
      })),
    };
  }

  // -----------------------------------------------------------------
  // SUBMIT + AUTO-GRADE
  // -----------------------------------------------------------------
  async submitAttempt(
    studentId: string,
    attemptId: string,
    dto: SubmitExamAttemptDto,
  ) {
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: {
        exam: { include: { questions: { include: { choices: true } } } },
      },
    });

    if (!attempt || attempt.studentId !== studentId) {
      throw new NotFoundException('Exam attempt not found');
    }
    if (attempt.status !== ExamAttemptStatus.IN_PROGRESS) {
      throw new BadRequestException('This attempt has already been submitted');
    }

    const deadline = new Date(
      attempt.startedAt.getTime() + attempt.exam.durationMin * 60_000,
    );
    const isExpired = new Date() > deadline;

    let totalScore = 0;
    let hasEssayQuestions = false;
    let hasUngradedFillBlank = false;
    const questionsById = new Map(
      attempt.exam.questions.map((q) => [q.id, q]),
    );

    const answerRows = dto.answers.map((answer) => {
      const question = questionsById.get(answer.questionId);
      if (!question) {
        throw new BadRequestException(
          `Question ${answer.questionId} does not belong to this exam`,
        );
      }

      let pointsAwarded: number | null = null;
      let isWrong = false;

      if (question.type === QuestionType.ESSAY) {
        hasEssayQuestions = true;
        pointsAwarded = null; // pending manual review
      } else if (question.type === QuestionType.FILL_BLANK) {
        const acceptedAnswers = question.choices.map((c) => c.textAr.trim().toLowerCase());
        if (acceptedAnswers.length === 0) {
          hasUngradedFillBlank = true;
          pointsAwarded = null; // no accepted-answer variants configured — needs manual review
        } else {
          const submitted = (answer.essayText ?? '').trim().toLowerCase();
          const isCorrect = acceptedAnswers.includes(submitted);
          pointsAwarded = isCorrect ? Number(question.points) : 0;
          isWrong = !isCorrect;
          totalScore += pointsAwarded;
        }
      } else if (question.type === QuestionType.MATCHING) {
        const matchMap = new Map(question.choices.map((c) => [c.id, c.matchValue?.trim().toLowerCase()]));
        const submitted = (answer.matchingAnswers as { choiceId: string; submittedMatch: string }[]) ?? [];
        const isFullyCorrect =
          submitted.length === question.choices.length &&
          submitted.every(
            (m) => matchMap.get(m.choiceId) === (m.submittedMatch ?? '').trim().toLowerCase(),
          );
        pointsAwarded = isFullyCorrect ? Number(question.points) : 0;
        isWrong = !isFullyCorrect;
        totalScore += pointsAwarded;
      } else if (question.type === QuestionType.ORDERING) {
        const correctOrderIds = [...question.choices]
          .sort((a, b) => a.order - b.order)
          .map((c) => c.id);
        const submittedOrderIds = answer.selectedChoiceIds ?? [];
        const isFullyCorrect =
          submittedOrderIds.length === correctOrderIds.length &&
          submittedOrderIds.every((id, idx) => id === correctOrderIds[idx]);
        pointsAwarded = isFullyCorrect ? Number(question.points) : 0;
        isWrong = !isFullyCorrect;
        totalScore += pointsAwarded;
      } else {
        // MCQ_SINGLE / MCQ_MULTIPLE / TRUE_FALSE
        const correctChoiceIds = new Set(
          question.choices.filter((c) => c.isCorrect).map((c) => c.id),
        );
        const selected = new Set(answer.selectedChoiceIds ?? []);

        const isFullyCorrect =
          selected.size === correctChoiceIds.size &&
          [...selected].every((id) => correctChoiceIds.has(id));

        pointsAwarded = isFullyCorrect ? Number(question.points) : 0;
        isWrong = !isFullyCorrect;
        totalScore += pointsAwarded;
      }

      // Negative Marking: deduct for definitively-wrong auto-graded answers
      // (never for essays / ungraded fill-blanks awaiting manual review).
      if (isWrong && attempt.exam.negativeMarkingEnabled) {
        totalScore -= Number(attempt.exam.negativeMarkPerWrong);
      }

      return {
        attemptId,
        questionId: answer.questionId,
        selectedChoiceIds: answer.selectedChoiceIds ?? [],
        essayText: answer.essayText,
        matchingAnswers: answer.matchingAnswers as any,
        pointsAwarded,
      };
    });

    // A score can't go below zero even with negative marking.
    totalScore = Math.max(0, totalScore);
    const needsManualReview = hasEssayQuestions || hasUngradedFillBlank;

    await this.prisma.$transaction([
      this.prisma.answer.createMany({ data: answerRows }),
      this.prisma.examAttempt.update({
        where: { id: attemptId },
        data: {
          status: isExpired
            ? ExamAttemptStatus.EXPIRED
            : ExamAttemptStatus.SUBMITTED,
          submittedAt: new Date(),
          scoreObtained: totalScore,
          gradingStatus: needsManualReview
            ? GradingStatus.PENDING_MANUAL_REVIEW
            : GradingStatus.AUTO_GRADED,
          // Pass/fail can only be finalized once essays/fill-blanks are graded
          ...(needsManualReview
            ? {}
            : {
                isPassed:
                  (totalScore / Number(attempt.scoreTotal ?? 1)) * 100 >=
                  Number(attempt.exam.passScorePct),
                gradedAt: new Date(),
              }),
        },
      }),
    ]);

    return this.getAttemptResult(attemptId, { id: studentId, role: Role.STUDENT } as AuthenticatedUser);
  }

  async getAttemptResult(attemptId: string, user: AuthenticatedUser) {
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: {
        exam: {
          select: {
            titleAr: true,
            passScorePct: true,
            negativeMarkingEnabled: true,
            course: { select: { teacherId: true } },
          },
        },
        answers: {
          include: {
            question: {
              include: {
                // Safe to reveal isCorrect/matchValue here — the attempt is
                // already submitted, so this powers "Answer Review".
                choices: true,
              },
            },
          },
        },
      },
    });
    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    const isOwner = attempt.studentId === user.id;
    const isCourseTeacher = attempt.exam.course?.teacherId === user.id;
    if (!isOwner && !isCourseTeacher && user.role !== Role.ADMIN) {
      throw new ForbiddenException('You cannot view this attempt');
    }

    return attempt;
  }

  async findMyAttempts(studentId: string) {
    return this.prisma.examAttempt.findMany({
      where: { studentId },
      orderBy: { startedAt: 'desc' },
      include: {
        exam: {
          select: { titleAr: true, passScorePct: true, course: { select: { titleAr: true } } },
        },
      },
    });
  }

  /**
   * Flattens each attempt's lifecycle (started -> submitted -> graded)
   * into individual chronological events, for the "Assignment Timeline"
   * view. Newest event first.
   */
  async findMyTimeline(studentId: string) {
    const attempts = await this.prisma.examAttempt.findMany({
      where: { studentId },
      orderBy: { startedAt: 'desc' },
      include: {
        exam: {
          select: { titleAr: true, passScorePct: true, course: { select: { titleAr: true } } },
        },
      },
    });

    const events: Array<{
      attemptId: string;
      examTitle: string;
      courseTitle: string | null;
      stage: 'STARTED' | 'SUBMITTED' | 'GRADED';
      date: Date;
      isPassed: boolean | null;
      scoreObtained: string | null;
      scoreTotal: string | null;
    }> = [];

    for (const attempt of attempts) {
      const base = {
        attemptId: attempt.id,
        examTitle: attempt.exam.titleAr,
        courseTitle: attempt.exam.course?.titleAr ?? null,
        isPassed: attempt.isPassed,
        scoreObtained: attempt.scoreObtained?.toString() ?? null,
        scoreTotal: attempt.scoreTotal?.toString() ?? null,
      };

      events.push({ ...base, stage: 'STARTED', date: attempt.startedAt });
      if (attempt.submittedAt) {
        events.push({ ...base, stage: 'SUBMITTED', date: attempt.submittedAt });
      }
      if (attempt.gradedAt) {
        events.push({ ...base, stage: 'GRADED', date: attempt.gradedAt });
      }
    }

    return events.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  // -----------------------------------------------------------------
  // MANUAL GRADING (essay questions) — Teacher/Admin
  // -----------------------------------------------------------------
  async gradeEssayAnswer(
    answerId: string,
    user: AuthenticatedUser,
    dto: ManualGradeAnswerDto,
  ) {
    const answer = await this.prisma.answer.findUnique({
      where: { id: answerId },
      include: {
        question: true,
        attempt: { include: { exam: { include: { course: true } } } },
      },
    });
    if (!answer) {
      throw new NotFoundException('Answer not found');
    }
    if (answer.attempt.exam.course && user.role !== Role.ADMIN) {
      if (answer.attempt.exam.course.teacherId !== user.id) {
        throw new ForbiddenException('You do not own this exam');
      }
    }

    await this.prisma.answer.update({
      where: { id: answerId },
      data: {
        pointsAwarded: dto.pointsAwarded,
        reviewerNote: dto.reviewerNote,
      },
    });

    return this.finalizeGradingIfComplete(answer.attemptId);
  }

  private async finalizeGradingIfComplete(attemptId: string) {
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: { answers: true, exam: true },
    });
    if (!attempt) return null;

    const stillPending = attempt.answers.some((a) => a.pointsAwarded === null);
    if (stillPending) {
      return attempt; // wait until every essay answer has been graded
    }

    const totalScore = attempt.answers.reduce(
      (sum, a) => sum + Number(a.pointsAwarded ?? 0),
      0,
    );
    const passScorePct = Number(attempt.exam.passScorePct);
    const scoreTotal = Number(attempt.scoreTotal ?? 1);

    return this.prisma.examAttempt.update({
      where: { id: attemptId },
      data: {
        scoreObtained: totalScore,
        gradingStatus: GradingStatus.REVIEWED,
        isPassed: (totalScore / scoreTotal) * 100 >= passScorePct,
        gradedAt: new Date(),
      },
    });
  }

  // -----------------------------------------------------------------
  // Utilities
  // -----------------------------------------------------------------
  private shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  private pickRandom<T>(array: T[], count: number): T[] {
    return this.shuffle(array).slice(0, count);
  }

  private getAttemptWithQuestions(attemptId: string, exam: { questions: any[] }) {
    return {
      attemptId,
      questions: exam.questions.map((q) => ({
        id: q.id,
        type: q.type,
        textAr: q.textAr,
        points: q.points,
        choices: q.choices.map((c: any) => ({ id: c.id, textAr: c.textAr })),
        ...(q.type === QuestionType.MATCHING
          ? { matchOptions: this.shuffle(q.choices.map((c: any) => c.matchValue)) }
          : {}),
      })),
    };
  }
}
