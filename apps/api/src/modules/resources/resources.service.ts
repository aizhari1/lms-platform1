import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateLessonResourceDto } from './dto/create-lesson-resource.dto';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { UploadsService } from '../uploads/uploads.service';

@Injectable()
export class ResourcesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploads: UploadsService,
  ) {}

  // -----------------------------------------------------------------
  // TEACHER — attach/remove resources on a lesson
  // -----------------------------------------------------------------
  async createForLesson(
    lessonId: string,
    user: AuthenticatedUser,
    dto: CreateLessonResourceDto,
  ) {
    await this.assertLessonOwnership(lessonId, user);

    return this.prisma.lessonResource.create({
      data: {
        lessonId,
        titleAr: dto.titleAr,
        fileUrl: dto.fileUrl,
        fileType: dto.fileType ?? 'pdf',
        fileSizeKb: dto.fileSizeKb,
      },
    });
  }

  async removeResource(resourceId: string, user: AuthenticatedUser) {
    const resource = await this.prisma.lessonResource.findUnique({
      where: { id: resourceId },
      include: { lesson: { include: { chapter: { include: { course: true } } } } },
    });
    if (!resource) throw new NotFoundException('Resource not found');
    if (user.role !== Role.ADMIN && resource.lesson.chapter.course.teacherId !== user.id) {
      throw new ForbiddenException('You do not own this course');
    }

    await this.prisma.lessonResource.delete({ where: { id: resourceId } });
    return { success: true };
  }

  async findByLesson(lessonId: string) {
    return this.prisma.lessonResource.findMany({
      where: { lessonId },
      orderBy: { createdAt: 'asc' },
    });
  }

  // -----------------------------------------------------------------
  // STUDENT — download center + saved resources
  // -----------------------------------------------------------------

  /** Every downloadable resource across every course the student is enrolled in. */
  async getDownloadCenter(studentId: string) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { studentId },
      select: { courseId: true },
    });
    const courseIds = enrollments.map((e) => e.courseId);
    if (courseIds.length === 0) return [];

    const [resources, savedResources] = await Promise.all([
      this.prisma.lessonResource.findMany({
        where: { lesson: { chapter: { courseId: { in: courseIds } } } },
        orderBy: { createdAt: 'desc' },
        include: {
          lesson: {
            select: {
              id: true,
              titleAr: true,
              chapter: { select: { course: { select: { id: true, slug: true, titleAr: true } } } },
            },
          },
        },
      }),
      this.prisma.savedResource.findMany({ where: { studentId }, select: { resourceId: true } }),
    ]);

    const savedIds = new Set(savedResources.map((s) => s.resourceId));

    return resources.map((r) => ({
      id: r.id,
      titleAr: r.titleAr,
      fileUrl: this.uploads.getSignedPlaybackUrl(r.fileUrl),
      fileType: r.fileType,
      fileSizeKb: r.fileSizeKb,
      createdAt: r.createdAt,
      isSaved: savedIds.has(r.id),
      lesson: { id: r.lesson.id, titleAr: r.lesson.titleAr },
      course: r.lesson.chapter.course,
    }));
  }

  /** All downloadable resources for one specific course (used inside the player). */
  async getCourseResources(studentId: string, courseId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId } },
    });
    if (!enrollment) throw new ForbiddenException('You are not enrolled in this course');

    const [resources, savedResources] = await Promise.all([
      this.prisma.lessonResource.findMany({
        where: { lesson: { chapter: { courseId } } },
        orderBy: { createdAt: 'asc' },
        include: { lesson: { select: { id: true, titleAr: true } } },
      }),
      this.prisma.savedResource.findMany({ where: { studentId }, select: { resourceId: true } }),
    ]);
    const savedIds = new Set(savedResources.map((s) => s.resourceId));

    return resources.map((r) => ({
      id: r.id,
      titleAr: r.titleAr,
      fileUrl: this.uploads.getSignedPlaybackUrl(r.fileUrl),
      fileType: r.fileType,
      fileSizeKb: r.fileSizeKb,
      isSaved: savedIds.has(r.id),
      lesson: r.lesson,
    }));
  }

  async saveResource(studentId: string, resourceId: string) {
    const resource = await this.prisma.lessonResource.findUnique({
      where: { id: resourceId },
      include: { lesson: { select: { chapter: { select: { courseId: true } } } } },
    });
    if (!resource) throw new NotFoundException('Resource not found');

    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        studentId_courseId: { studentId, courseId: resource.lesson.chapter.courseId },
      },
    });
    if (!enrollment) throw new ForbiddenException('You are not enrolled in this course');

    await this.prisma.savedResource.upsert({
      where: { studentId_resourceId: { studentId, resourceId } },
      update: {},
      create: { studentId, resourceId },
    });
    return { success: true };
  }

  async unsaveResource(studentId: string, resourceId: string) {
    await this.prisma.savedResource
      .delete({ where: { studentId_resourceId: { studentId, resourceId } } })
      .catch(() => undefined);
    return { success: true };
  }

  async getSavedResources(studentId: string) {
    const saved = await this.prisma.savedResource.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      include: {
        resource: {
          include: {
            lesson: {
              select: {
                id: true,
                titleAr: true,
                chapter: {
                  select: { course: { select: { id: true, slug: true, titleAr: true } } },
                },
              },
            },
          },
        },
      },
    });

    return saved.map((s) => ({
      id: s.resource.id,
      titleAr: s.resource.titleAr,
      fileUrl: this.uploads.getSignedPlaybackUrl(s.resource.fileUrl),
      fileType: s.resource.fileType,
      fileSizeKb: s.resource.fileSizeKb,
      lesson: { id: s.resource.lesson.id, titleAr: s.resource.lesson.titleAr },
      course: s.resource.lesson.chapter.course,
    }));
  }

  private async assertLessonOwnership(lessonId: string, user: AuthenticatedUser) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { chapter: { include: { course: { select: { teacherId: true } } } } },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');
    if (user.role !== Role.ADMIN && lesson.chapter.course.teacherId !== user.id) {
      throw new ForbiddenException('You do not own this course');
    }
  }
}
