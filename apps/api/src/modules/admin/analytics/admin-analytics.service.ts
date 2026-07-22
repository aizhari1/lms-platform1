import { Injectable } from '@nestjs/common';
import { PaymentStatus, Role } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class AdminAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * High-level KPI cards shown at the top of the admin dashboard.
   */
  async getOverview() {
    const [
      totalStudents,
      totalTeachers,
      totalCourses,
      publishedCourses,
      totalEnrollments,
      revenueAggregate,
    ] = await Promise.all([
      this.prisma.user.count({ where: { role: Role.STUDENT, deletedAt: null } }),
      this.prisma.user.count({ where: { role: Role.TEACHER, deletedAt: null } }),
      this.prisma.course.count({ where: { deletedAt: null } }),
      this.prisma.course.count({ where: { status: 'PUBLISHED', deletedAt: null } }),
      this.prisma.enrollment.count(),
      this.prisma.order.aggregate({
        where: { status: PaymentStatus.PAID },
        _sum: { totalAmount: true },
      }),
    ]);

    return {
      totalStudents,
      totalTeachers,
      totalCourses,
      publishedCourses,
      totalEnrollments,
      totalRevenue: revenueAggregate._sum.totalAmount ?? 0,
    };
  }

  /**
   * Revenue grouped by day for the last N days — powers the Recharts
   * line chart on the admin reports page.
   */
  async getRevenueOverTime(days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const orders = await this.prisma.order.findMany({
      where: { status: PaymentStatus.PAID, paidAt: { gte: since } },
      select: { paidAt: true, totalAmount: true },
    });

    const dailyRevenue = new Map<string, number>();
    for (const order of orders) {
      const dateKey = order.paidAt!.toISOString().slice(0, 10);
      dailyRevenue.set(
        dateKey,
        (dailyRevenue.get(dateKey) ?? 0) + Number(order.totalAmount),
      );
    }

    return Array.from(dailyRevenue.entries())
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Top-performing courses by number of enrollments — for the
   * "best sellers" widget on the admin dashboard.
   */
  async getTopCourses(limit = 10) {
    return this.prisma.course.findMany({
      where: { deletedAt: null },
      orderBy: { totalStudents: 'desc' },
      take: limit,
      select: {
        id: true,
        titleAr: true,
        totalStudents: true,
        averageRating: true,
        price: true,
        teacher: { select: { fullName: true } },
      },
    });
  }

  async getUserGrowth(days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const users = await this.prisma.user.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true, role: true },
    });

    const dailySignups = new Map<string, number>();
    for (const user of users) {
      const dateKey = user.createdAt.toISOString().slice(0, 10);
      dailySignups.set(dateKey, (dailySignups.get(dateKey) ?? 0) + 1);
    }

    return Array.from(dailySignups.entries())
      .map(([date, signups]) => ({ date, signups }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}
