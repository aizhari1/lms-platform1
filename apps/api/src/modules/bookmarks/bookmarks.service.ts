import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';

@Injectable()
export class BookmarksService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertEnrolled(studentId: string, lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { chapter: { select: { courseId: true } } },
    });
    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        studentId_courseId: { studentId, courseId: lesson.chapter.courseId },
      },
    });
    if (!enrollment) {
      throw new ForbiddenException('You are not enrolled in this course');
    }

    return lesson;
  }

  async create(studentId: string, dto: CreateBookmarkDto) {
    await this.assertEnrolled(studentId, dto.lessonId);

    return this.prisma.bookmark.create({
      data: {
        studentId,
        lessonId: dto.lessonId,
        timestampSec: dto.timestampSec,
        label: dto.label,
      },
    });
  }

  async findByLesson(studentId: string, lessonId: string) {
    return this.prisma.bookmark.findMany({
      where: { studentId, lessonId },
      orderBy: { timestampSec: 'asc' },
    });
  }

  /** All bookmarks across every course (the student's "Bookmarks" page). */
  async findAllForStudent(studentId: string) {
    const bookmarks = await this.prisma.bookmark.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      include: {
        lesson: {
          select: {
            id: true,
            titleAr: true,
            titleEn: true,
            chapter: {
              select: {
                course: {
                  select: { id: true, slug: true, titleAr: true, titleEn: true },
                },
              },
            },
          },
        },
      },
    });

    return bookmarks.map((bookmark) => ({
      id: bookmark.id,
      timestampSec: bookmark.timestampSec,
      label: bookmark.label,
      createdAt: bookmark.createdAt,
      lesson: {
        id: bookmark.lesson.id,
        titleAr: bookmark.lesson.titleAr,
        titleEn: bookmark.lesson.titleEn,
      },
      course: bookmark.lesson.chapter.course,
    }));
  }

  async remove(studentId: string, bookmarkId: string) {
    const bookmark = await this.prisma.bookmark.findUnique({ where: { id: bookmarkId } });
    if (!bookmark || bookmark.studentId !== studentId) {
      throw new NotFoundException('Bookmark not found');
    }

    await this.prisma.bookmark.delete({ where: { id: bookmarkId } });
    return { success: true };
  }
}
