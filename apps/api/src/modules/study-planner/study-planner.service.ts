import { NotFoundException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateStudyPlanItemDto } from './dto/create-study-plan-item.dto';
import { UpdateStudyPlanItemDto } from './dto/update-study-plan-item.dto';

@Injectable()
export class StudyPlannerService {
  constructor(private readonly prisma: PrismaService) {}

  async create(studentId: string, dto: CreateStudyPlanItemDto) {
    return this.prisma.studyPlanItem.create({
      data: {
        studentId,
        titleAr: dto.titleAr,
        notes: dto.notes,
        courseId: dto.courseId,
        dueDate: new Date(dto.dueDate),
      },
    });
  }

  async findAll(studentId: string) {
    return this.prisma.studyPlanItem.findMany({
      where: { studentId },
      orderBy: { dueDate: 'asc' },
      include: { course: { select: { id: true, slug: true, titleAr: true } } },
    });
  }

  async update(studentId: string, itemId: string, dto: UpdateStudyPlanItemDto) {
    const item = await this.prisma.studyPlanItem.findUnique({ where: { id: itemId } });
    if (!item || item.studentId !== studentId) {
      throw new NotFoundException('Study plan item not found');
    }

    return this.prisma.studyPlanItem.update({
      where: { id: itemId },
      data: {
        ...(dto.titleAr !== undefined ? { titleAr: dto.titleAr } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
        ...(dto.dueDate !== undefined ? { dueDate: new Date(dto.dueDate) } : {}),
        ...(dto.isCompleted !== undefined
          ? { isCompleted: dto.isCompleted, completedAt: dto.isCompleted ? new Date() : null }
          : {}),
      },
    });
  }

  async remove(studentId: string, itemId: string) {
    const item = await this.prisma.studyPlanItem.findUnique({ where: { id: itemId } });
    if (!item || item.studentId !== studentId) {
      throw new NotFoundException('Study plan item not found');
    }

    await this.prisma.studyPlanItem.delete({ where: { id: itemId } });
    return { success: true };
  }

  /**
   * Merges the student's own study-plan tasks with scheduled live
   * sessions from courses they're enrolled in, into one chronological
   * calendar feed. Optionally bounded by [from, to].
   */
  async getCalendar(studentId: string, from?: string, to?: string) {
    const dateFilter =
      from || to
        ? {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to) } : {}),
          }
        : undefined;

    const [planItems, enrollments] = await Promise.all([
      this.prisma.studyPlanItem.findMany({
        where: { studentId, ...(dateFilter ? { dueDate: dateFilter } : {}) },
        include: { course: { select: { id: true, slug: true, titleAr: true } } },
      }),
      this.prisma.enrollment.findMany({
        where: { studentId },
        select: { courseId: true },
      }),
    ]);

    const enrolledCourseIds = enrollments.map((e) => e.courseId);

    const liveSessions = enrolledCourseIds.length
      ? await this.prisma.liveSession.findMany({
          where: {
            ...(dateFilter ? { scheduledAt: dateFilter } : {}),
            lesson: { chapter: { courseId: { in: enrolledCourseIds } } },
          },
          include: {
            lesson: {
              select: {
                id: true,
                titleAr: true,
                chapter: { select: { course: { select: { id: true, slug: true, titleAr: true } } } },
              },
            },
          },
        })
      : [];

    const planEvents = planItems.map((item) => ({
      id: `plan-${item.id}`,
      type: 'STUDY_TASK' as const,
      title: item.titleAr,
      date: item.dueDate,
      isCompleted: item.isCompleted,
      course: item.course,
      raw: item,
    }));

    const liveEvents = liveSessions.map((session) => ({
      id: `live-${session.id}`,
      type: 'LIVE_SESSION' as const,
      title: session.titleAr,
      date: session.scheduledAt,
      isCompleted: false,
      course: session.lesson?.chapter.course ?? null,
      meetingUrl: session.meetingUrl,
    }));

    return [...planEvents, ...liveEvents].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
  }
}
