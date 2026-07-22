import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';

@Injectable()
export class NotesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * A student may only take notes on lessons that belong to a course
   * they're actually enrolled in.
   */
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

  async create(studentId: string, dto: CreateNoteDto) {
    await this.assertEnrolled(studentId, dto.lessonId);

    return this.prisma.note.create({
      data: {
        studentId,
        lessonId: dto.lessonId,
        content: dto.content,
        timestampSec: dto.timestampSec,
      },
    });
  }

  /** All notes for one lesson (used inside the player). */
  async findByLesson(studentId: string, lessonId: string) {
    return this.prisma.note.findMany({
      where: { studentId, lessonId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** All notes across every course (the student's "My Notes" page). */
  async findAllForStudent(studentId: string) {
    const notes = await this.prisma.note.findMany({
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

    return notes.map((note) => ({
      id: note.id,
      content: note.content,
      timestampSec: note.timestampSec,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
      lesson: { id: note.lesson.id, titleAr: note.lesson.titleAr, titleEn: note.lesson.titleEn },
      course: note.lesson.chapter.course,
    }));
  }

  async update(studentId: string, noteId: string, dto: UpdateNoteDto) {
    const note = await this.prisma.note.findUnique({ where: { id: noteId } });
    if (!note || note.studentId !== studentId) {
      throw new NotFoundException('Note not found');
    }

    return this.prisma.note.update({
      where: { id: noteId },
      data: { content: dto.content },
    });
  }

  async remove(studentId: string, noteId: string) {
    const note = await this.prisma.note.findUnique({ where: { id: noteId } });
    if (!note || note.studentId !== studentId) {
      throw new NotFoundException('Note not found');
    }

    await this.prisma.note.delete({ where: { id: noteId } });
    return { success: true };
  }
}
