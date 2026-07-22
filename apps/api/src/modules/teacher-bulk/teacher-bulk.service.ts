import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { SubmissionStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { MailService } from '../mail/mail.service';
import { JobsService } from '../queue/jobs.service';

@Injectable()
export class TeacherBulkService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly mail: MailService,
    private readonly jobsService: JobsService,
  ) {}

  private async getEnrolledStudents(courseId: string, teacherId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { teacherId: true },
    });
    if (!course) throw new NotFoundException('Course not found');
    if (course.teacherId !== teacherId) {
      throw new ForbiddenException('You do not own this course');
    }

    return this.prisma.enrollment.findMany({
      where: { courseId },
      select: { student: { select: { id: true, email: true, fullName: true } } },
    });
  }

  /**
   * Bulk Notifications — for a handful of students this could run
   * inline, but a popular course can have thousands of enrollments, so
   * it's dispatched to the background queue instead of blocking the
   * teacher's request until every notification is written.
   */
  async bulkNotify(courseId: string, teacherId: string, titleAr: string, bodyAr: string) {
    const enrollments = await this.getEnrolledStudents(courseId, teacherId);

    await this.jobsService.enqueue('BULK_NOTIFY', {
      userIds: enrollments.map((e) => e.student.id),
      titleAr,
      bodyAr,
      courseId,
    });

    return { queuedFor: enrollments.length };
  }

  /** Bulk Emails — same reasoning: queued, not sent synchronously in the request. */
  async bulkEmail(courseId: string, teacherId: string, subject: string, bodyHtml: string) {
    const enrollments = await this.getEnrolledStudents(courseId, teacherId);

    await this.jobsService.enqueue('BULK_EMAIL', {
      recipientEmails: enrollments.map((e) => e.student.email),
      subject,
      bodyHtml,
    });

    return { queuedFor: enrollments.length };
  }

  /**
   * Bulk Assignment Review — grade many straightforward submissions at
   * once with the same score/feedback (e.g. everyone who clearly met
   * the requirements), instead of opening each one individually.
   */
  async bulkGradeSubmissions(
    teacherId: string,
    submissionIds: string[],
    grade: number,
    feedbackAr?: string,
  ) {
    const submissions = await this.prisma.assignmentSubmission.findMany({
      where: { id: { in: submissionIds } },
      include: { assignment: { select: { courseId: true } } },
    });

    const courseIds = new Set(submissions.map((s) => s.assignment.courseId));
    const ownedCourses = await this.prisma.course.findMany({
      where: { id: { in: [...courseIds] }, teacherId },
      select: { id: true },
    });
    if (ownedCourses.length !== courseIds.size) {
      throw new ForbiddenException('You do not own one or more of these submissions\' courses');
    }

    await this.prisma.assignmentSubmission.updateMany({
      where: { id: { in: submissionIds } },
      data: { grade, feedbackAr, status: SubmissionStatus.GRADED, gradedAt: new Date() },
    });

    await Promise.all(
      submissions.map((s) =>
        this.notifications.notify({
          userId: s.studentId,
          type: 'EXAM',
          titleAr: 'تم تصحيح واجبك',
          bodyAr: `حصلت على ${grade} في واجبك`,
          metadata: { submissionId: s.id },
        }),
      ),
    );

    return { gradedCount: submissions.length };
  }
}
