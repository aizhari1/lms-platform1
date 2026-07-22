import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { QuestionType, Role } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateExamDto,
  CreateQuestionDto,
  UpdateExamDto,
  UpdateQuestionDto,
} from './dto/exam.dto';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@Injectable()
export class ExamsService {
  constructor(private readonly prisma: PrismaService) {}

  // -----------------------------------------------------------------
  // EXAM CRUD (Teacher/Admin)
  // -----------------------------------------------------------------
  async create(user: AuthenticatedUser, dto: CreateExamDto) {
    if (dto.courseId) {
      await this.assertCourseOwnership(dto.courseId, user);
    }

    return this.prisma.exam.create({
      data: {
        titleAr: dto.titleAr,
        descriptionAr: dto.descriptionAr,
        courseId: dto.courseId,
        durationMin: dto.durationMin,
        passScorePct: dto.passScorePct,
        randomizeOrder: dto.randomizeOrder ?? false,
        questionsToPick: dto.questionsToPick,
        maxAttempts: dto.maxAttempts ?? 1,
      },
    });
  }

  async update(examId: string, user: AuthenticatedUser, dto: UpdateExamDto) {
    const exam = await this.findExamOrThrow(examId);
    await this.assertExamOwnership(exam, user);

    return this.prisma.exam.update({ where: { id: examId }, data: dto });
  }

  async findOneWithQuestions(examId: string, user: AuthenticatedUser) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: {
        questions: {
          orderBy: { order: 'asc' },
          include: { choices: true },
        },
        course: { select: { teacherId: true } },
      },
    });
    if (!exam) {
      throw new NotFoundException('Exam not found');
    }
    if (exam.course) {
      this.assertOwnershipOrAdmin(exam.course.teacherId, user);
    }
    return exam;
  }

  async remove(examId: string, user: AuthenticatedUser): Promise<void> {
    const exam = await this.findExamOrThrow(examId);
    await this.assertExamOwnership(exam, user);
    await this.prisma.exam.delete({ where: { id: examId } });
  }

  // -----------------------------------------------------------------
  // QUESTION CRUD
  // -----------------------------------------------------------------
  async addQuestion(
    examId: string,
    user: AuthenticatedUser,
    dto: CreateQuestionDto,
  ) {
    const exam = await this.findExamOrThrow(examId);
    await this.assertExamOwnership(exam, user);

    this.validateChoicesForType(dto.type, dto.choices);

    const lastQuestion = await this.prisma.question.findFirst({
      where: { examId },
      orderBy: { order: 'desc' },
    });

    return this.prisma.question.create({
      data: {
        examId,
        type: dto.type,
        textAr: dto.textAr,
        points: dto.points ?? 1,
        explanationAr: dto.explanationAr,
        difficulty: dto.difficulty,
        categoryId: dto.categoryId,
        order: lastQuestion ? lastQuestion.order + 1 : 0,
        choices: dto.choices
          ? {
              create: dto.choices.map((c, idx) => ({
                textAr: c.textAr,
                isCorrect: c.isCorrect ?? false,
                matchValue: c.matchValue,
                // For ORDERING, the order they're submitted IS the correct order.
                order: idx,
              })),
            }
          : undefined,
      },
      include: { choices: true },
    });
  }

  async updateQuestion(
    questionId: string,
    user: AuthenticatedUser,
    dto: UpdateQuestionDto,
  ) {
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
      include: { exam: { include: { course: true } } },
    });
    if (!question) {
      throw new NotFoundException('Question not found');
    }
    if (question.exam.course) {
      this.assertOwnershipOrAdmin(question.exam.course.teacherId, user);
    }

    if (dto.choices) {
      this.validateChoicesForType(dto.type ?? question.type, dto.choices);
      // Replace choices entirely for simplicity/consistency
      await this.prisma.choice.deleteMany({ where: { questionId } });
      await this.prisma.choice.createMany({
        data: dto.choices.map((c, idx) => ({
          questionId,
          textAr: c.textAr,
          isCorrect: c.isCorrect ?? false,
          matchValue: c.matchValue,
          order: idx,
        })),
      });
    }

    return this.prisma.question.update({
      where: { id: questionId },
      data: {
        type: dto.type,
        textAr: dto.textAr,
        points: dto.points,
        explanationAr: dto.explanationAr,
        difficulty: dto.difficulty,
        categoryId: dto.categoryId,
      },
      include: { choices: true },
    });
  }

  async removeQuestion(questionId: string, user: AuthenticatedUser): Promise<void> {
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
      include: { exam: { include: { course: true } } },
    });
    if (!question) {
      throw new NotFoundException('Question not found');
    }
    if (question.exam.course) {
      this.assertOwnershipOrAdmin(question.exam.course.teacherId, user);
    }
    await this.prisma.question.delete({ where: { id: questionId } });
  }

  // -----------------------------------------------------------------
  // EXAM ANALYTICS (Teacher)
  // -----------------------------------------------------------------
  async getExamAnalytics(examId: string, user: AuthenticatedUser) {
    const exam = await this.findExamOrThrow(examId);
    await this.assertExamOwnership(exam, user);

    const attempts = await this.prisma.examAttempt.findMany({
      where: { examId, status: { in: ['SUBMITTED', 'GRADED', 'EXPIRED'] } },
      select: { scoreObtained: true, scoreTotal: true, isPassed: true },
    });

    const graded = attempts.filter((a) => a.scoreObtained !== null);
    const passedCount = attempts.filter((a) => a.isPassed).length;
    const avgScorePct =
      graded.length > 0
        ? graded.reduce(
            (sum, a) => sum + (Number(a.scoreObtained) / Number(a.scoreTotal || 1)) * 100,
            0,
          ) / graded.length
        : 0;

    // Per-question difficulty: how often each question was answered correctly.
    const questions = await this.prisma.question.findMany({
      where: { examId },
      select: { id: true, textAr: true, difficulty: true, points: true },
    });
    const answers = await this.prisma.answer.findMany({
      where: { question: { examId } },
      select: { questionId: true, pointsAwarded: true },
    });

    const questionBreakdown = questions.map((q) => {
      const relevantAnswers = answers.filter((a) => a.questionId === q.id);
      const correctCount = relevantAnswers.filter(
        (a) => a.pointsAwarded !== null && Number(a.pointsAwarded) >= Number(q.points),
      ).length;
      return {
        questionId: q.id,
        textAr: q.textAr,
        difficulty: q.difficulty,
        totalAnswered: relevantAnswers.length,
        correctCount,
        correctRatePct:
          relevantAnswers.length > 0 ? (correctCount / relevantAnswers.length) * 100 : 0,
      };
    });

    return {
      totalAttempts: attempts.length,
      passedCount,
      passRatePct: attempts.length > 0 ? (passedCount / attempts.length) * 100 : 0,
      averageScorePct: avgScorePct,
      questionBreakdown,
    };
  }

  // -----------------------------------------------------------------
  // QUESTION CATEGORIES (per course — powers the "Question Bank" view)
  // -----------------------------------------------------------------
  async createCategory(courseId: string, user: AuthenticatedUser, nameAr: string) {
    await this.assertCourseOwnership(courseId, user);
    return this.prisma.questionCategory.create({ data: { courseId, nameAr } });
  }

  async findCategories(courseId: string) {
    return this.prisma.questionCategory.findMany({
      where: { courseId },
      orderBy: { createdAt: 'asc' },
    });
  }

  /** Question Bank: every question ever written for a course's exams, filterable by category/difficulty. */
  async findQuestionBank(
    courseId: string,
    user: AuthenticatedUser,
    filters: { categoryId?: string; difficulty?: string },
  ) {
    await this.assertCourseOwnership(courseId, user);

    return this.prisma.question.findMany({
      where: {
        exam: { courseId },
        ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
        ...(filters.difficulty ? { difficulty: filters.difficulty as any } : {}),
      },
      include: { choices: true, category: true, exam: { select: { id: true, titleAr: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async removeCategory(categoryId: string, user: AuthenticatedUser) {
    const category = await this.prisma.questionCategory.findUnique({ where: { id: categoryId } });
    if (!category) throw new NotFoundException('Category not found');
    await this.assertCourseOwnership(category.courseId, user);
    await this.prisma.questionCategory.delete({ where: { id: categoryId } });
    return { success: true };
  }

  // -----------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------
  private validateChoicesForType(
    type: QuestionType,
    choices?: { isCorrect?: boolean; matchValue?: string }[],
  ): void {
    if (type === QuestionType.ESSAY) {
      return; // no choices needed — always manually graded
    }
    if (type === QuestionType.FILL_BLANK) {
      return; // choices optional: 0 = manual review, 1+ = accepted-answer variants for auto-grading
    }
    if (!choices || choices.length < 2) {
      throw new BadRequestException(
        'This question type requires at least 2 choices',
      );
    }
    if (type === QuestionType.MATCHING) {
      if (choices.some((c) => !c.matchValue)) {
        throw new BadRequestException(
          'Every MATCHING choice needs a matchValue (the correct right-side pair)',
        );
      }
      return;
    }
    if (type === QuestionType.ORDERING) {
      return; // order is derived from submission order, nothing to validate here
    }

    const correctCount = choices.filter((c) => c.isCorrect).length;
    if (correctCount === 0) {
      throw new BadRequestException('At least one choice must be marked correct');
    }
    if (type === QuestionType.MCQ_SINGLE && correctCount > 1) {
      throw new BadRequestException(
        'MCQ_SINGLE questions must have exactly one correct choice',
      );
    }
  }

  private async findExamOrThrow(examId: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: { course: { select: { teacherId: true } } },
    });
    if (!exam) {
      throw new NotFoundException('Exam not found');
    }
    return exam;
  }

  private async assertExamOwnership(
    exam: { course: { teacherId: string } | null },
    user: AuthenticatedUser,
  ): Promise<void> {
    if (exam.course) {
      this.assertOwnershipOrAdmin(exam.course.teacherId, user);
    } else if (user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only admins can manage standalone exams');
    }
  }

  private async assertCourseOwnership(
    courseId: string,
    user: AuthenticatedUser,
  ): Promise<void> {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { teacherId: true },
    });
    if (!course) {
      throw new BadRequestException('Course does not exist');
    }
    this.assertOwnershipOrAdmin(course.teacherId, user);
  }

  private assertOwnershipOrAdmin(
    ownerTeacherId: string,
    user: AuthenticatedUser,
  ): void {
    if (user.role === Role.ADMIN) return;
    if (user.id !== ownerTeacherId) {
      throw new ForbiddenException('You do not own this exam');
    }
  }
}
