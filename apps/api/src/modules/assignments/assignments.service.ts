import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Role, SubmissionStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateAssignmentDto,
  UpdateAssignmentDto,
  SubmitAssignmentDto,
  GradeSubmissionDto,
  RequestRevisionDto,
} from './dto/assignment.dto';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AssignmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  private async assertCourseOwnership(courseId: string, user: AuthenticatedUser) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { teacherId: true },
    });
    if (!course) throw new NotFoundException('Course not found');
    if (user.role !== Role.ADMIN && course.teacherId !== user.id) {
      throw new ForbiddenException('You do not own this course');
    }
  }

  // -----------------------------------------------------------------
  // TEACHER — Assignment + Rubric CRUD
  // -----------------------------------------------------------------
  async create(courseId: string, user: AuthenticatedUser, dto: CreateAssignmentDto) {
    await this.assertCourseOwnership(courseId, user);

    return this.prisma.assignment.create({
      data: {
        courseId,
        lessonId: dto.lessonId,
        titleAr: dto.titleAr,
        descriptionAr: dto.descriptionAr,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        allowLateSubmission: dto.allowLateSubmission ?? true,
        latePenaltyPctPerDay: dto.latePenaltyPctPerDay ?? 0,
        maxFiles: dto.maxFiles ?? 3,
        maxPoints: dto.maxPoints ?? 100,
        rubric: dto.rubricCriteria
          ? {
              create: {
                criteria: {
                  create: dto.rubricCriteria.map((c, idx) => ({
                    titleAr: c.titleAr,
                    maxPoints: c.maxPoints,
                    order: idx,
                  })),
                },
              },
            }
          : undefined,
      },
      include: { rubric: { include: { criteria: true } } },
    });
  }

  async update(assignmentId: string, user: AuthenticatedUser, dto: UpdateAssignmentDto) {
    const assignment = await this.findOrThrow(assignmentId);
    await this.assertCourseOwnership(assignment.courseId, user);

    return this.prisma.assignment.update({
      where: { id: assignmentId },
      data: {
        ...(dto.titleAr !== undefined ? { titleAr: dto.titleAr } : {}),
        ...(dto.descriptionAr !== undefined ? { descriptionAr: dto.descriptionAr } : {}),
        ...(dto.dueDate !== undefined ? { dueDate: new Date(dto.dueDate) } : {}),
        ...(dto.allowLateSubmission !== undefined
          ? { allowLateSubmission: dto.allowLateSubmission }
          : {}),
        ...(dto.latePenaltyPctPerDay !== undefined
          ? { latePenaltyPctPerDay: dto.latePenaltyPctPerDay }
          : {}),
        ...(dto.maxFiles !== undefined ? { maxFiles: dto.maxFiles } : {}),
      },
    });
  }

  async remove(assignmentId: string, user: AuthenticatedUser) {
    const assignment = await this.findOrThrow(assignmentId);
    await this.assertCourseOwnership(assignment.courseId, user);
    await this.prisma.assignment.delete({ where: { id: assignmentId } });
    return { success: true };
  }

  async findByCourse(courseId: string) {
    return this.prisma.assignment.findMany({
      where: { courseId },
      orderBy: { createdAt: 'desc' },
      include: { rubric: { include: { criteria: true } } },
    });
  }

  // -----------------------------------------------------------------
  // TEACHER — Reviewing submissions
  // -----------------------------------------------------------------
  /** Latest submission per student for one assignment (the grading queue). */
  async findLatestSubmissions(assignmentId: string, user: AuthenticatedUser) {
    const assignment = await this.findOrThrow(assignmentId);
    await this.assertCourseOwnership(assignment.courseId, user);

    const allSubmissions = await this.prisma.assignmentSubmission.findMany({
      where: { assignmentId },
      orderBy: { attemptNumber: 'desc' },
      include: {
        student: { select: { id: true, fullName: true, avatarUrl: true } },
        files: true,
      },
    });

    const latestByStudent = new Map<string, (typeof allSubmissions)[number]>();
    for (const submission of allSubmissions) {
      if (!latestByStudent.has(submission.studentId)) {
        latestByStudent.set(submission.studentId, submission);
      }
    }
    return Array.from(latestByStudent.values());
  }

  async gradeSubmission(submissionId: string, user: AuthenticatedUser, dto: GradeSubmissionDto) {
    const submission = await this.prisma.assignmentSubmission.findUnique({
      where: { id: submissionId },
      include: { assignment: true },
    });
    if (!submission) throw new NotFoundException('Submission not found');
    await this.assertCourseOwnership(submission.assignment.courseId, user);

    let finalGrade = dto.grade ?? 0;

    if (dto.rubricScores && dto.rubricScores.length > 0) {
      await this.prisma.$transaction(
        dto.rubricScores.map((score) =>
          this.prisma.rubricScore.upsert({
            where: {
              submissionId_criterionId: {
                submissionId,
                criterionId: score.criterionId,
              },
            },
            update: { pointsAwarded: score.pointsAwarded, comment: score.comment },
            create: {
              submissionId,
              criterionId: score.criterionId,
              pointsAwarded: score.pointsAwarded,
              comment: score.comment,
            },
          }),
        ),
      );
      finalGrade = dto.rubricScores.reduce((sum, s) => sum + s.pointsAwarded, 0);
    }

    // Late Submission Rule: automatically apply the daily penalty.
    if (submission.isLate && submission.assignment.dueDate) {
      const daysLate = Math.ceil(
        (submission.submittedAt.getTime() - submission.assignment.dueDate.getTime()) / 86_400_000,
      );
      const penaltyPct = Math.min(
        100,
        daysLate * Number(submission.assignment.latePenaltyPctPerDay),
      );
      finalGrade = finalGrade * (1 - penaltyPct / 100);
    }

    const updated = await this.prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        grade: finalGrade,
        feedbackAr: dto.feedbackAr,
        status: SubmissionStatus.GRADED,
        gradedAt: new Date(),
      },
    });

    await this.notifications.notify({
      userId: submission.studentId,
      type: 'EXAM',
      titleAr: 'تم تصحيح واجبك',
      bodyAr: `حصلت على ${finalGrade.toFixed(1)} في "${submission.assignment.titleAr}"`,
      metadata: { assignmentId: submission.assignmentId, submissionId },
    });

    return updated;
  }

  /** Revision Requests: teacher sends it back without a final grade. */
  async requestRevision(submissionId: string, user: AuthenticatedUser, dto: RequestRevisionDto) {
    const submission = await this.prisma.assignmentSubmission.findUnique({
      where: { id: submissionId },
      include: { assignment: true },
    });
    if (!submission) throw new NotFoundException('Submission not found');
    await this.assertCourseOwnership(submission.assignment.courseId, user);

    const updated = await this.prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: { status: SubmissionStatus.REVISION_REQUESTED, revisionNote: dto.revisionNote },
    });

    await this.notifications.notify({
      userId: submission.studentId,
      type: 'EXAM',
      titleAr: 'مطلوب مراجعة على واجبك',
      bodyAr: `المدرّس طلب منك تعديل تسليمك لـ "${submission.assignment.titleAr}"`,
      metadata: { assignmentId: submission.assignmentId, submissionId },
    });

    return updated;
  }

  // -----------------------------------------------------------------
  // STUDENT
  // -----------------------------------------------------------------
  async findForStudent(courseId: string, studentId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId } },
    });
    if (!enrollment) throw new ForbiddenException('You are not enrolled in this course');

    const assignments = await this.prisma.assignment.findMany({
      where: { courseId },
      orderBy: { createdAt: 'asc' },
      include: { rubric: { include: { criteria: true } } },
    });

    const submissions = await this.prisma.assignmentSubmission.findMany({
      where: { studentId, assignmentId: { in: assignments.map((a) => a.id) } },
      orderBy: { attemptNumber: 'desc' },
    });
    const latestByAssignment = new Map<string, (typeof submissions)[number]>();
    for (const s of submissions) {
      if (!latestByAssignment.has(s.assignmentId)) latestByAssignment.set(s.assignmentId, s);
    }

    return assignments.map((a) => ({
      ...a,
      mySubmission: latestByAssignment.get(a.id) ?? null,
    }));
  }

  /** Submission History: every attempt the student made on this assignment. */
  async findMySubmissionHistory(assignmentId: string, studentId: string) {
    return this.prisma.assignmentSubmission.findMany({
      where: { assignmentId, studentId },
      orderBy: { attemptNumber: 'asc' },
      include: { files: true, rubricScores: { include: { criterion: true } } },
    });
  }

  async submit(assignmentId: string, studentId: string, dto: SubmitAssignmentDto) {
    const assignment = await this.findOrThrow(assignmentId);

    const enrollment = await this.prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId: assignment.courseId } },
    });
    if (!enrollment) throw new ForbiddenException('You are not enrolled in this course');

    if (dto.files.length > assignment.maxFiles) {
      throw new BadRequestException(
        `You can upload at most ${assignment.maxFiles} file(s) for this assignment`,
      );
    }

    const now = new Date();
    const isLate = Boolean(assignment.dueDate && now > assignment.dueDate);

    // Late Submission Rule: block entirely if late submissions aren't allowed.
    if (isLate && !assignment.allowLateSubmission) {
      throw new BadRequestException('The deadline for this assignment has passed');
    }

    const previousCount = await this.prisma.assignmentSubmission.count({
      where: { assignmentId, studentId },
    });

    const submission = await this.prisma.assignmentSubmission.create({
      data: {
        assignmentId,
        studentId,
        attemptNumber: previousCount + 1,
        isLate,
        notesAr: dto.notesAr,
        submittedAt: now,
        files: { create: dto.files },
      },
      include: { files: true },
    });

    return submission;
  }

  private async findOrThrow(assignmentId: string) {
    const assignment = await this.prisma.assignment.findUnique({ where: { id: assignmentId } });
    if (!assignment) throw new NotFoundException('Assignment not found');
    return assignment;
  }
}
