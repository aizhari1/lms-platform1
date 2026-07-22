import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CourseStatus, EnrollmentSource } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class EnrollmentsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Directly enrolls a student in a course.
   * Called by the Payments module after a successful payment (source =
   * PURCHASE/COUPON) or directly by an Admin (source = ADMIN_GRANT), or
   * immediately for free courses (source = FREE). This method itself
   * does NOT handle payment — that's the Payments module's job.
   */
  async enrollStudent(
    studentId: string,
    courseId: string,
    source: EnrollmentSource = EnrollmentSource.PURCHASE,
  ) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course || course.status !== CourseStatus.PUBLISHED) {
      throw new NotFoundException('Course not found or not published');
    }

    const existing = await this.prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId } },
    });
    if (existing) {
      throw new ConflictException('You are already enrolled in this course');
    }

    const [enrollment] = await this.prisma.$transaction([
      this.prisma.enrollment.create({
        data: { studentId, courseId, source },
      }),
      this.prisma.course.update({
        where: { id: courseId },
        data: { totalStudents: { increment: 1 } },
      }),
    ]);

    return enrollment;
  }

  /**
   * Enroll directly for a free course (price = 0), skipping the
   * payment flow entirely. Used by the "Enroll for free" button.
   */
  async enrollFree(studentId: string, courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    if (Number(course.price) > 0) {
      throw new BadRequestException(
        'This course is not free — proceed through checkout instead',
      );
    }
    return this.enrollStudent(studentId, courseId, EnrollmentSource.FREE);
  }

  async findMyEnrollments(studentId: string) {
    return this.prisma.enrollment.findMany({
      where: { studentId },
      orderBy: { enrolledAt: 'desc' },
      include: {
        course: {
          select: {
            id: true,
            slug: true,
            titleAr: true,
            titleEn: true,
            thumbnailUrl: true,
            totalDurationSec: true,
            teacher: { select: { fullName: true } },
          },
        },
      },
    });
  }

  async checkAccess(studentId: string, courseId: string): Promise<boolean> {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId } },
    });
    return !!enrollment;
  }

  async getEnrollmentOrThrow(studentId: string, courseId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId } },
    });
    if (!enrollment) {
      throw new NotFoundException('You are not enrolled in this course');
    }
    return enrollment;
  }

  /**
   * [Teacher/Admin] List of students enrolled in a specific course,
   * used for the teacher analytics dashboard.
   */
  async findStudentsForCourse(courseId: string) {
    return this.prisma.enrollment.findMany({
      where: { courseId },
      orderBy: { enrolledAt: 'desc' },
      include: {
        student: {
          select: { id: true, fullName: true, email: true, avatarUrl: true },
        },
      },
    });
  }
}
