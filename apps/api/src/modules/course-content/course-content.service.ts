import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateFaqDto, CreateAnnouncementDto } from './dto/course-content.dto';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class CourseContentService {
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
  // FAQ
  // -----------------------------------------------------------------
  async createFaq(courseId: string, user: AuthenticatedUser, dto: CreateFaqDto) {
    await this.assertCourseOwnership(courseId, user);
    return this.prisma.courseFAQ.create({
      data: { courseId, questionAr: dto.questionAr, answerAr: dto.answerAr, order: dto.order ?? 0 },
    });
  }

  async findFaqs(courseId: string) {
    return this.prisma.courseFAQ.findMany({
      where: { courseId },
      orderBy: { order: 'asc' },
    });
  }

  async removeFaq(faqId: string, user: AuthenticatedUser) {
    const faq = await this.prisma.courseFAQ.findUnique({ where: { id: faqId } });
    if (!faq) throw new NotFoundException('FAQ not found');
    await this.assertCourseOwnership(faq.courseId, user);
    await this.prisma.courseFAQ.delete({ where: { id: faqId } });
    return { success: true };
  }

  // -----------------------------------------------------------------
  // ANNOUNCEMENTS
  // -----------------------------------------------------------------
  async createAnnouncement(courseId: string, user: AuthenticatedUser, dto: CreateAnnouncementDto) {
    await this.assertCourseOwnership(courseId, user);

    const announcement = await this.prisma.courseAnnouncement.create({
      data: { courseId, titleAr: dto.titleAr, bodyAr: dto.bodyAr },
    });

    // Notify every enrolled student in-app (respecting their preferences).
    const enrollments = await this.prisma.enrollment.findMany({
      where: { courseId },
      select: { studentId: true },
    });
    await Promise.all(
      enrollments.map((e) =>
        this.notifications.notify({
          userId: e.studentId,
          type: 'ANNOUNCEMENT',
          titleAr: dto.titleAr,
          bodyAr: dto.bodyAr,
          metadata: { courseId },
        }),
      ),
    );

    return announcement;
  }

  async findAnnouncements(courseId: string) {
    return this.prisma.courseAnnouncement.findMany({
      where: { courseId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async removeAnnouncement(announcementId: string, user: AuthenticatedUser) {
    const announcement = await this.prisma.courseAnnouncement.findUnique({
      where: { id: announcementId },
    });
    if (!announcement) throw new NotFoundException('Announcement not found');
    await this.assertCourseOwnership(announcement.courseId, user);
    await this.prisma.courseAnnouncement.delete({ where: { id: announcementId } });
    return { success: true };
  }
}
