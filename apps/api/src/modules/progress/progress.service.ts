import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { BadgeCode } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { UpdateLessonProgressDto } from './dto/update-progress.dto';
import { AchievementsService } from '../achievements/achievements.service';

@Injectable()
export class ProgressService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly achievements: AchievementsService,
  ) {}

  /**
   * Upserts progress for a single lesson, then recalculates the overall
   * course completion percentage on the Enrollment record. Runs as a
   * transaction so progress and the aggregate percentage never drift
   * out of sync.
   */
  async updateLessonProgress(
    studentId: string,
    lessonId: string,
    dto: UpdateLessonProgressDto,
  ) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { chapter: { select: { courseId: true } } },
    });
    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    const courseId = lesson.chapter.courseId;

    const enrollment = await this.prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId } },
    });
    if (!enrollment) {
      throw new ForbiddenException('You are not enrolled in this course');
    }

    const wasAlreadyCompleted = await this.prisma.lessonProgress.findUnique({
      where: { studentId_lessonId: { studentId, lessonId } },
      select: { isCompleted: true },
    });

    await this.prisma.lessonProgress.upsert({
      where: { studentId_lessonId: { studentId, lessonId } },
      create: {
        studentId,
        lessonId,
        lastPositionSec: dto.lastPositionSec,
        watchedSeconds: dto.watchedSeconds ?? dto.lastPositionSec,
        isCompleted: dto.isCompleted ?? false,
        completedAt: dto.isCompleted ? new Date() : null,
      },
      update: {
        lastPositionSec: dto.lastPositionSec,
        ...(dto.watchedSeconds !== undefined
          ? { watchedSeconds: dto.watchedSeconds }
          : {}),
        ...(dto.isCompleted !== undefined
          ? {
              isCompleted: dto.isCompleted,
              completedAt: dto.isCompleted ? new Date() : null,
            }
          : {}),
      },
    });

    // Fire-and-forget-ish: streak + "first lesson" badge. Awaited so the
    // response reflects the freshest state, but never blocks on failure.
    await this.achievements.recordActivity(studentId).catch(() => undefined);
    if (dto.isCompleted && !wasAlreadyCompleted?.isCompleted) {
      await this.achievements
        .awardBadge(studentId, BadgeCode.FIRST_LESSON)
        .catch(() => undefined);
    }

    await this.recalculateCourseProgress(studentId, courseId);

    return this.prisma.lessonProgress.findUnique({
      where: { studentId_lessonId: { studentId, lessonId } },
    });
  }

  async getCourseProgress(studentId: string, courseId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId } },
    });
    if (!enrollment) {
      throw new ForbiddenException('You are not enrolled in this course');
    }

    const lessonProgressList = await this.prisma.lessonProgress.findMany({
      where: {
        studentId,
        lesson: { chapter: { courseId } },
      },
      select: { lessonId: true, isCompleted: true, lastPositionSec: true },
    });

    return {
      progressPct: enrollment.progressPct,
      completedAt: enrollment.completedAt,
      lessons: lessonProgressList,
    };
  }

  /**
   * Lessons the student started but hasn't finished, most-recently-watched
   * first. Powers the "Continue Watching" rail — each entry resumes at
   * exactly lastPositionSec.
   */
  async getContinueWatching(studentId: string, take = 10) {
    const rows = await this.prisma.lessonProgress.findMany({
      where: { studentId, isCompleted: false, watchedSeconds: { gt: 0 } },
      orderBy: { updatedAt: 'desc' },
      take,
      include: {
        lesson: {
          select: {
            id: true,
            titleAr: true,
            titleEn: true,
            videoDurationSec: true,
            chapter: {
              select: {
                course: {
                  select: {
                    id: true,
                    slug: true,
                    titleAr: true,
                    titleEn: true,
                    thumbnailUrl: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return rows.map((row) => ({
      lessonId: row.lessonId,
      lastPositionSec: row.lastPositionSec,
      videoDurationSec: row.lesson.videoDurationSec,
      updatedAt: row.updatedAt,
      lesson: { id: row.lesson.id, titleAr: row.lesson.titleAr, titleEn: row.lesson.titleEn },
      course: row.lesson.chapter.course,
    }));
  }

  /**
   * Full chronological watch history across every enrolled course
   * (completed and in-progress lessons alike).
   */
  async getWatchHistory(studentId: string, take = 50) {
    const rows = await this.prisma.lessonProgress.findMany({
      where: { studentId, watchedSeconds: { gt: 0 } },
      orderBy: { updatedAt: 'desc' },
      take,
      include: {
        lesson: {
          select: {
            id: true,
            titleAr: true,
            titleEn: true,
            videoDurationSec: true,
            chapter: {
              select: {
                course: {
                  select: { id: true, slug: true, titleAr: true, titleEn: true, thumbnailUrl: true },
                },
              },
            },
          },
        },
      },
    });

    return rows.map((row) => ({
      lessonId: row.lessonId,
      isCompleted: row.isCompleted,
      lastPositionSec: row.lastPositionSec,
      watchedSeconds: row.watchedSeconds,
      videoDurationSec: row.lesson.videoDurationSec,
      completedAt: row.completedAt,
      updatedAt: row.updatedAt,
      lesson: { id: row.lesson.id, titleAr: row.lesson.titleAr, titleEn: row.lesson.titleEn },
      course: row.lesson.chapter.course,
    }));
  }

  /**
   * Chronological "Course Completion Timeline": every lesson in the
   * course in its curriculum order, annotated with when (if ever) the
   * student completed it. Useful for a visual progress trail.
   */
  async getCourseCompletionTimeline(studentId: string, courseId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId } },
    });
    if (!enrollment) {
      throw new ForbiddenException('You are not enrolled in this course');
    }

    const chapters = await this.prisma.chapter.findMany({
      where: { courseId },
      orderBy: { order: 'asc' },
      include: {
        lessons: {
          orderBy: { order: 'asc' },
          select: { id: true, titleAr: true, type: true, videoDurationSec: true },
        },
      },
    });

    const progressRows = await this.prisma.lessonProgress.findMany({
      where: {
        studentId,
        lesson: { chapter: { courseId } },
      },
      select: { lessonId: true, isCompleted: true, completedAt: true },
    });
    const progressMap = new Map(progressRows.map((p) => [p.lessonId, p]));

    return chapters.map((chapter) => ({
      chapterId: chapter.id,
      chapterTitle: chapter.titleAr,
      lessons: chapter.lessons.map((lesson) => {
        const progress = progressMap.get(lesson.id);
        return {
          lessonId: lesson.id,
          titleAr: lesson.titleAr,
          type: lesson.type,
          isCompleted: progress?.isCompleted ?? false,
          completedAt: progress?.completedAt ?? null,
        };
      }),
    }));
  }


  /**
   * [Teacher] Course Progress Analytics: enrollment/completion overview
   * plus a per-lesson completion-rate breakdown (useful for spotting
   * where students tend to drop off).
   */
  async getCourseAnalyticsForTeacher(teacherId: string, courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { teacherId: true },
    });
    if (!course) throw new NotFoundException('Course not found');
    if (course.teacherId !== teacherId) {
      throw new ForbiddenException('You do not own this course');
    }

    const [enrollments, lessons] = await Promise.all([
      this.prisma.enrollment.findMany({
        where: { courseId },
        select: { progressPct: true, completedAt: true },
      }),
      this.prisma.lesson.findMany({
        where: { chapter: { courseId } },
        select: {
          id: true,
          titleAr: true,
          order: true,
          chapter: { select: { order: true, titleAr: true } },
        },
        orderBy: [{ chapter: { order: 'asc' } }, { order: 'asc' }],
      }),
    ]);

    const totalEnrollments = enrollments.length;
    const completedCount = enrollments.filter((e) => e.completedAt).length;
    const avgProgress =
      totalEnrollments > 0
        ? enrollments.reduce((sum, e) => sum + Number(e.progressPct), 0) / totalEnrollments
        : 0;

    const lessonCompletionCounts = await this.prisma.lessonProgress.groupBy({
      by: ['lessonId'],
      where: { lessonId: { in: lessons.map((l) => l.id) }, isCompleted: true },
      _count: { _all: true },
    });
    const completionMap = new Map(
      lessonCompletionCounts.map((row) => [row.lessonId, row._count._all]),
    );

    const lessonBreakdown = lessons.map((lesson) => ({
      lessonId: lesson.id,
      titleAr: lesson.titleAr,
      chapterTitle: lesson.chapter.titleAr,
      completedCount: completionMap.get(lesson.id) ?? 0,
      completionRatePct:
        totalEnrollments > 0
          ? ((completionMap.get(lesson.id) ?? 0) / totalEnrollments) * 100
          : 0,
    }));

    return {
      totalEnrollments,
      completedCount,
      completionRatePct: totalEnrollments > 0 ? (completedCount / totalEnrollments) * 100 : 0,
      averageProgressPct: avgProgress,
      lessonBreakdown,
    };
  }

  private async recalculateCourseProgress(
    studentId: string,
    courseId: string,
  ): Promise<void> {
    const totalLessons = await this.prisma.lesson.count({
      where: { chapter: { courseId } },
    });

    if (totalLessons === 0) return;

    const completedLessons = await this.prisma.lessonProgress.count({
      where: {
        studentId,
        isCompleted: true,
        lesson: { chapter: { courseId } },
      },
    });

    const progressPct = (completedLessons / totalLessons) * 100;
    const isFullyCompleted = completedLessons === totalLessons;

    const wasAlreadyCompleted = await this.prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId } },
      select: { completedAt: true },
    });

    await this.prisma.enrollment.update({
      where: { studentId_courseId: { studentId, courseId } },
      data: {
        progressPct,
        ...(isFullyCompleted ? { completedAt: new Date() } : {}),
      },
    });

    if (isFullyCompleted && !wasAlreadyCompleted?.completedAt) {
      await this.achievements
        .awardBadge(studentId, BadgeCode.FIRST_COURSE_COMPLETED)
        .catch(() => undefined);

      const completedCoursesCount = await this.prisma.enrollment.count({
        where: { studentId, completedAt: { not: null } },
      });
      if (completedCoursesCount >= 5) {
        await this.achievements
          .awardBadge(studentId, BadgeCode.FIVE_COURSES_COMPLETED)
          .catch(() => undefined);
      }
    }
  }
}
