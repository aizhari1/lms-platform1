import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import {
  CreateLessonDto,
  ReorderLessonsDto,
  UpdateLessonDto,
} from './dto/lesson.dto';
import { AuthenticatedUser } from '../../auth/strategies/jwt.strategy';
import { UploadsService } from '../../uploads/uploads.service';

@Injectable()
export class LessonsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploads: UploadsService,
  ) {}

  // -----------------------------------------------------------------
  // TEACHER — CRUD
  // -----------------------------------------------------------------
  async create(
    chapterId: string,
    user: AuthenticatedUser,
    dto: CreateLessonDto,
  ) {
    await this.assertChapterOwnership(chapterId, user);

    const lastLesson = await this.prisma.lesson.findFirst({
      where: { chapterId },
      orderBy: { order: 'desc' },
    });

    const lesson = await this.prisma.lesson.create({
      data: {
        chapterId,
        titleAr: dto.titleAr,
        titleEn: dto.titleEn,
        type: dto.type,
        order: dto.order ?? (lastLesson ? lastLesson.order + 1 : 0),
        videoUrl: dto.videoUrl,
        videoDurationSec: dto.videoDurationSec,
        videoChapters: dto.videoChapters as any,
        transcriptAr: dto.transcriptAr,
        subtitlesUrl: dto.subtitlesUrl,
        pdfUrl: dto.pdfUrl,
        articleContent: dto.articleContent,
        isFreePreview: dto.isFreePreview ?? false,
      },
    });

    // Keep the parent course's total duration roughly in sync
    if (dto.videoDurationSec) {
      await this.recalculateCourseDuration(chapterId);
    }

    return lesson;
  }

  async update(
    lessonId: string,
    user: AuthenticatedUser,
    dto: UpdateLessonDto,
  ) {
    const lesson = await this.findLessonWithOwnerOrThrow(lessonId);
    this.assertOwnershipOrAdmin(lesson.chapter.course.teacherId, user);

    const updated = await this.prisma.lesson.update({
      where: { id: lessonId },
      data: dto as any,
    });

    if (dto.videoDurationSec !== undefined) {
      await this.recalculateCourseDuration(lesson.chapterId);
    }

    return updated;
  }

  async reorder(
    chapterId: string,
    user: AuthenticatedUser,
    dto: ReorderLessonsDto,
  ): Promise<void> {
    await this.assertChapterOwnership(chapterId, user);

    const existingLessons = await this.prisma.lesson.findMany({
      where: { chapterId },
      select: { id: true },
    });
    const existingIds = new Set(existingLessons.map((l) => l.id));

    const valid =
      dto.orderedLessonIds.every((id) => existingIds.has(id)) &&
      dto.orderedLessonIds.length === existingLessons.length;

    if (!valid) {
      throw new BadRequestException(
        'orderedLessonIds must include exactly all lessons of this chapter',
      );
    }

    await this.prisma.$transaction(
      dto.orderedLessonIds.map((lessonId, index) =>
        this.prisma.lesson.update({
          where: { id: lessonId },
          data: { order: index },
        }),
      ),
    );
  }

  async remove(lessonId: string, user: AuthenticatedUser): Promise<void> {
    const lesson = await this.findLessonWithOwnerOrThrow(lessonId);
    this.assertOwnershipOrAdmin(lesson.chapter.course.teacherId, user);

    await this.prisma.lesson.delete({ where: { id: lessonId } });
    await this.recalculateCourseDuration(lesson.chapterId);
  }

  // -----------------------------------------------------------------
  // STUDENT — watch a lesson (gated by enrollment or free preview)
  // -----------------------------------------------------------------
  async findForStudent(lessonId: string, studentId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        chapter: {
          include: {
            course: { select: { id: true } },
            lessons: { orderBy: { order: 'asc' }, select: { id: true, order: true } },
          },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    if (!lesson.isFreePreview) {
      const enrollment = await this.prisma.enrollment.findUnique({
        where: {
          studentId_courseId: {
            studentId,
            courseId: lesson.chapter.course.id,
          },
        },
      });

      if (!enrollment) {
        throw new ForbiddenException(
          'You must enroll in this course to access this lesson',
        );
      }
    }

    const [progress, student] = await Promise.all([
      this.prisma.lessonProgress.findUnique({
        where: { studentId_lessonId: { studentId, lessonId } },
        select: { lastPositionSec: true },
      }),
      this.prisma.user.findUnique({ where: { id: studentId }, select: { fullName: true } }),
    ]);

    // Auto Next Lesson: figure out what comes right after this one in the
    // chapter's lesson order.
    const siblingLessons = lesson.chapter.lessons;
    const currentIndex = siblingLessons.findIndex((l) => l.id === lessonId);
    const nextLessonId = siblingLessons[currentIndex + 1]?.id ?? null;

    return {
      ...lesson,
      // Signed Streaming URL — short-lived, not directly hotlinkable/downloadable.
      videoUrl: lesson.videoUrl ? this.uploads.getSignedPlaybackUrl(lesson.videoUrl) : null,
      lastPositionSec: progress?.lastPositionSec ?? 0,
      watermarkText: student?.fullName ?? '',
      nextLessonId,
    };
  }

  // -----------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------
  private async findLessonWithOwnerOrThrow(lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        chapter: { include: { course: { select: { teacherId: true } } } },
      },
    });
    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }
    return lesson;
  }

  private async assertChapterOwnership(
    chapterId: string,
    user: AuthenticatedUser,
  ): Promise<void> {
    const chapter = await this.prisma.chapter.findUnique({
      where: { id: chapterId },
      include: { course: { select: { teacherId: true } } },
    });
    if (!chapter) {
      throw new NotFoundException('Chapter not found');
    }
    this.assertOwnershipOrAdmin(chapter.course.teacherId, user);
  }

  private assertOwnershipOrAdmin(
    ownerTeacherId: string,
    user: AuthenticatedUser,
  ): void {
    if (user.role === Role.ADMIN) return;
    if (user.id !== ownerTeacherId) {
      throw new ForbiddenException('You do not own this course');
    }
  }

  private async recalculateCourseDuration(chapterId: string): Promise<void> {
    const chapter = await this.prisma.chapter.findUnique({
      where: { id: chapterId },
      select: { courseId: true },
    });
    if (!chapter) return;

    const lessons = await this.prisma.lesson.findMany({
      where: { chapter: { courseId: chapter.courseId } },
      select: { videoDurationSec: true },
    });

    const totalDurationSec = lessons.reduce(
      (sum, l) => sum + (l.videoDurationSec ?? 0),
      0,
    );

    await this.prisma.course.update({
      where: { id: chapter.courseId },
      data: { totalDurationSec },
    });
  }
}
