import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import {
  CreateChapterDto,
  ReorderChaptersDto,
  UpdateChapterDto,
} from './dto/chapter.dto';
import { AuthenticatedUser } from '../../auth/strategies/jwt.strategy';

@Injectable()
export class ChaptersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    courseId: string,
    user: AuthenticatedUser,
    dto: CreateChapterDto,
  ) {
    await this.assertCourseOwnership(courseId, user);

    const lastChapter = await this.prisma.chapter.findFirst({
      where: { courseId },
      orderBy: { order: 'desc' },
    });

    return this.prisma.chapter.create({
      data: {
        courseId,
        titleAr: dto.titleAr,
        titleEn: dto.titleEn,
        order: dto.order ?? (lastChapter ? lastChapter.order + 1 : 0),
      },
    });
  }

  async findAllForCourse(courseId: string, user: AuthenticatedUser) {
    await this.assertCourseOwnership(courseId, user);

    return this.prisma.chapter.findMany({
      where: { courseId },
      orderBy: { order: 'asc' },
      include: { lessons: { orderBy: { order: 'asc' } } },
    });
  }

  async update(
    chapterId: string,
    user: AuthenticatedUser,
    dto: UpdateChapterDto,
  ) {
    const chapter = await this.findChapterWithCourseOrThrow(chapterId);
    this.assertOwnershipOrAdmin(chapter.course.teacherId, user);

    return this.prisma.chapter.update({
      where: { id: chapterId },
      data: dto,
    });
  }

  async reorder(
    courseId: string,
    user: AuthenticatedUser,
    dto: ReorderChaptersDto,
  ): Promise<void> {
    await this.assertCourseOwnership(courseId, user);

    const existingChapters = await this.prisma.chapter.findMany({
      where: { courseId },
      select: { id: true },
    });
    const existingIds = new Set(existingChapters.map((c) => c.id));

    const allIdsBelongToCourse = dto.orderedChapterIds.every((id) =>
      existingIds.has(id),
    );
    if (
      !allIdsBelongToCourse ||
      dto.orderedChapterIds.length !== existingChapters.length
    ) {
      throw new BadRequestException(
        'orderedChapterIds must include exactly all chapters of this course',
      );
    }

    await this.prisma.$transaction(
      dto.orderedChapterIds.map((chapterId, index) =>
        this.prisma.chapter.update({
          where: { id: chapterId },
          data: { order: index },
        }),
      ),
    );
  }

  async remove(chapterId: string, user: AuthenticatedUser): Promise<void> {
    const chapter = await this.findChapterWithCourseOrThrow(chapterId);
    this.assertOwnershipOrAdmin(chapter.course.teacherId, user);

    // onDelete: Cascade in schema takes care of removing lessons too
    await this.prisma.chapter.delete({ where: { id: chapterId } });
  }

  // -----------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------
  private async findChapterWithCourseOrThrow(chapterId: string) {
    const chapter = await this.prisma.chapter.findUnique({
      where: { id: chapterId },
      include: { course: { select: { teacherId: true } } },
    });
    if (!chapter) {
      throw new NotFoundException('Chapter not found');
    }
    return chapter;
  }

  private async assertCourseOwnership(
    courseId: string,
    user: AuthenticatedUser,
  ): Promise<void> {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { teacherId: true, deletedAt: true },
    });
    if (!course || course.deletedAt) {
      throw new NotFoundException('Course not found');
    }
    this.assertOwnershipOrAdmin(course.teacherId, user);
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
}
