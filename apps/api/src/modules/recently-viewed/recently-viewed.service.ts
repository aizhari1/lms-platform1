import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class RecentlyViewedService {
  constructor(private readonly prisma: PrismaService) {}

  /** Called (fire-and-forget from the client) whenever a student opens a course page. */
  async recordView(studentId: string, courseId: string) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');

    await this.prisma.recentlyViewedCourse.upsert({
      where: { studentId_courseId: { studentId, courseId } },
      update: { viewedAt: new Date() },
      create: { studentId, courseId },
    });
    return { success: true };
  }

  async findRecent(studentId: string, take = 12) {
    const rows = await this.prisma.recentlyViewedCourse.findMany({
      where: { studentId },
      orderBy: { viewedAt: 'desc' },
      take,
      include: {
        course: {
          select: {
            id: true,
            slug: true,
            titleAr: true,
            titleEn: true,
            thumbnailUrl: true,
            price: true,
            averageRating: true,
          },
        },
      },
    });

    return rows.map((row) => ({ viewedAt: row.viewedAt, course: row.course }));
  }
}
