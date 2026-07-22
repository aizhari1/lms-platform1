import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class TeacherAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  // -----------------------------------------------------------------
  // REVENUE ANALYTICS
  // -----------------------------------------------------------------
  async getRevenueAnalytics(teacherId: string) {
    const earnings = await this.prisma.teacherEarning.findMany({
      where: { teacherId },
      include: { order: { select: { courseId: true, course: { select: { titleAr: true } } } } },
      orderBy: { createdAt: 'asc' },
    });

    const totalRevenue = earnings.reduce((sum, e) => sum + Number(e.netAmount), 0);

    // Monthly trend (last 12 months worth of data present).
    const monthlyMap = new Map<string, number>();
    for (const e of earnings) {
      const key = e.createdAt.toISOString().slice(0, 7); // YYYY-MM
      monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + Number(e.netAmount));
    }
    const monthlyTrend = Array.from(monthlyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, amount]) => ({ month, amount }));

    // Per-course breakdown.
    const byCourseMap = new Map<string, { courseTitle: string; amount: number }>();
    for (const e of earnings) {
      if (!e.order.courseId) continue;
      const key = e.order.courseId;
      const existing = byCourseMap.get(key);
      byCourseMap.set(key, {
        courseTitle: e.order.course?.titleAr ?? 'Unknown',
        amount: (existing?.amount ?? 0) + Number(e.netAmount),
      });
    }
    const byCourse = Array.from(byCourseMap.values()).sort((a, b) => b.amount - a.amount);

    return { totalRevenue, monthlyTrend, byCourse };
  }

  // -----------------------------------------------------------------
  // STUDENT ANALYTICS
  // -----------------------------------------------------------------
  async getStudentAnalytics(teacherId: string) {
    const courses = await this.prisma.course.findMany({
      where: { teacherId },
      select: { id: true, titleAr: true },
    });
    const courseIds = courses.map((c) => c.id);

    const enrollments = await this.prisma.enrollment.findMany({
      where: { courseId: { in: courseIds } },
      select: { studentId: true, courseId: true, enrolledAt: true },
    });

    const uniqueStudents = new Set(enrollments.map((e) => e.studentId));

    const monthlyMap = new Map<string, number>();
    for (const e of enrollments) {
      const key = e.enrolledAt.toISOString().slice(0, 7);
      monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + 1);
    }
    const newEnrollmentsTrend = Array.from(monthlyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({ month, count }));

    const perCourse = courses.map((course) => ({
      courseId: course.id,
      courseTitle: course.titleAr,
      studentCount: enrollments.filter((e) => e.courseId === course.id).length,
    }));

    return {
      totalUniqueStudents: uniqueStudents.size,
      totalEnrollments: enrollments.length,
      newEnrollmentsTrend,
      perCourse: perCourse.sort((a, b) => b.studentCount - a.studentCount),
    };
  }

  // -----------------------------------------------------------------
  // RETENTION ANALYTICS
  // -----------------------------------------------------------------
  async getRetentionAnalytics(teacherId: string) {
    const courses = await this.prisma.course.findMany({
      where: { teacherId },
      select: { id: true, titleAr: true },
    });
    const courseIds = courses.map((c) => c.id);

    const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000);

    const [totalEnrollments, activeStudentRows] = await Promise.all([
      this.prisma.enrollment.count({ where: { courseId: { in: courseIds } } }),
      this.prisma.lessonProgress.findMany({
        where: {
          updatedAt: { gte: thirtyDaysAgo },
          lesson: { chapter: { courseId: { in: courseIds } } },
        },
        select: { studentId: true },
        distinct: ['studentId'],
      }),
    ]);

    const activeStudents = activeStudentRows.length;
    const retentionRatePct =
      totalEnrollments > 0 ? (activeStudents / totalEnrollments) * 100 : 0;

    return {
      totalEnrollments,
      activeStudents,
      inactiveStudents: Math.max(0, totalEnrollments - activeStudents),
      retentionRatePct,
    };
  }

  // -----------------------------------------------------------------
  // COURSE PERFORMANCE + COMPLETION ANALYTICS (all courses, compared)
  // -----------------------------------------------------------------
  async getCoursePerformance(teacherId: string) {
    const courses = await this.prisma.course.findMany({
      where: { teacherId },
      select: {
        id: true,
        titleAr: true,
        averageRating: true,
        totalStudents: true,
        totalReviews: true,
      },
    });

    const results = await Promise.all(
      courses.map(async (course) => {
        const enrollments = await this.prisma.enrollment.findMany({
          where: { courseId: course.id },
          select: { progressPct: true, completedAt: true },
        });
        const completedCount = enrollments.filter((e) => e.completedAt).length;
        const avgProgress =
          enrollments.length > 0
            ? enrollments.reduce((s, e) => s + Number(e.progressPct), 0) / enrollments.length
            : 0;

        return {
          courseId: course.id,
          courseTitle: course.titleAr,
          averageRating: course.averageRating,
          totalReviews: course.totalReviews,
          enrollmentCount: enrollments.length,
          completedCount,
          completionRatePct: enrollments.length > 0 ? (completedCount / enrollments.length) * 100 : 0,
          averageProgressPct: avgProgress,
        };
      }),
    );

    return results.sort((a, b) => b.enrollmentCount - a.enrollmentCount);
  }

  // -----------------------------------------------------------------
  // DASHBOARD WIDGETS — one aggregated call for the dashboard home
  // -----------------------------------------------------------------
  async getDashboardWidgets(teacherId: string) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const startOfWeek = new Date(Date.now() - 7 * 86_400_000);

    const courses = await this.prisma.course.findMany({
      where: { teacherId },
      select: { id: true },
    });
    const courseIds = courses.map((c) => c.id);

    const [revenueThisMonth, newStudentsThisWeek, performance, pendingSubmissions, openTickets] =
      await Promise.all([
        this.prisma.teacherEarning.aggregate({
          where: { teacherId, createdAt: { gte: startOfMonth } },
          _sum: { netAmount: true },
        }),
        this.prisma.enrollment.count({
          where: { courseId: { in: courseIds }, enrolledAt: { gte: startOfWeek } },
        }),
        this.getCoursePerformance(teacherId),
        this.prisma.assignmentSubmission.count({
          where: { assignment: { courseId: { in: courseIds } }, status: 'SUBMITTED' },
        }),
        this.prisma.examAttempt.count({
          where: { exam: { courseId: { in: courseIds } }, gradingStatus: 'PENDING_MANUAL_REVIEW' },
        }),
      ]);

    const avgCompletionRate =
      performance.length > 0
        ? performance.reduce((s, p) => s + p.completionRatePct, 0) / performance.length
        : 0;
    const topCourse = performance[0] ?? null;

    return {
      revenueThisMonth: revenueThisMonth._sum.netAmount ?? 0,
      newStudentsThisWeek,
      averageCompletionRatePct: avgCompletionRate,
      topCourse,
      pendingAssignmentReviews: pendingSubmissions,
      pendingExamReviews: openTickets,
    };
  }

  // -----------------------------------------------------------------
  // EXPORT REPORTS — CSV
  // -----------------------------------------------------------------
  async exportStudentsReportCsv(teacherId: string): Promise<string> {
    const courses = await this.prisma.course.findMany({
      where: { teacherId },
      select: { id: true, titleAr: true },
    });

    const rows: string[] = ['Course,Student Name,Email,Enrolled At,Progress %,Completed'];
    for (const course of courses) {
      const enrollments = await this.prisma.enrollment.findMany({
        where: { courseId: course.id },
        include: { student: { select: { fullName: true, email: true } } },
      });
      for (const e of enrollments) {
        rows.push(
          [
            this.csvEscape(course.titleAr),
            this.csvEscape(e.student.fullName),
            this.csvEscape(e.student.email),
            e.enrolledAt.toISOString(),
            Number(e.progressPct).toFixed(1),
            e.completedAt ? 'Yes' : 'No',
          ].join(','),
        );
      }
    }
    return rows.join('\n');
  }

  async exportRevenueReportCsv(teacherId: string): Promise<string> {
    const earnings = await this.prisma.teacherEarning.findMany({
      where: { teacherId },
      include: { order: { select: { orderNo: true, course: { select: { titleAr: true } } } } },
      orderBy: { createdAt: 'desc' },
    });

    const rows: string[] = ['Date,Order No,Course,Gross Amount,Commission %,Net Amount'];
    for (const e of earnings) {
      rows.push(
        [
          e.createdAt.toISOString(),
          this.csvEscape(e.order.orderNo),
          this.csvEscape(e.order.course?.titleAr ?? ''),
          e.amount.toString(),
          e.commissionPct.toString(),
          e.netAmount.toString(),
        ].join(','),
      );
    }
    return rows.join('\n');
  }

  private csvEscape(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
}
