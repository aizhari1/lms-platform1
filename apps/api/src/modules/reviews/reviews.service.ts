import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateReviewDto } from './dto/review.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(studentId: string, courseId: string, dto: CreateReviewDto) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId } },
    });
    if (!enrollment) {
      throw new ForbiddenException(
        'You must be enrolled in this course to review it',
      );
    }

    const existing = await this.prisma.review.findUnique({
      where: { studentId_courseId: { studentId, courseId } },
    });
    if (existing) {
      throw new ConflictException(
        'You have already reviewed this course — use update instead',
      );
    }

    const review = await this.prisma.review.create({
      data: { studentId, courseId, rating: dto.rating, comment: dto.comment },
    });

    await this.recalculateCourseRating(courseId);
    return review;
  }

  async update(studentId: string, courseId: string, dto: CreateReviewDto) {
    const existing = await this.prisma.review.findUnique({
      where: { studentId_courseId: { studentId, courseId } },
    });
    if (!existing) {
      throw new NotFoundException('Review not found');
    }

    const review = await this.prisma.review.update({
      where: { id: existing.id },
      data: { rating: dto.rating, comment: dto.comment },
    });

    await this.recalculateCourseRating(courseId);
    return review;
  }

  async remove(studentId: string, courseId: string): Promise<void> {
    const existing = await this.prisma.review.findUnique({
      where: { studentId_courseId: { studentId, courseId } },
    });
    if (!existing) {
      throw new NotFoundException('Review not found');
    }

    await this.prisma.review.delete({ where: { id: existing.id } });
    await this.recalculateCourseRating(courseId);
  }

  async findForCourse(courseId: string) {
    return this.prisma.review.findMany({
      where: { courseId },
      orderBy: { createdAt: 'desc' },
      include: { student: { select: { fullName: true, avatarUrl: true } } },
    });
  }

  private async recalculateCourseRating(courseId: string): Promise<void> {
    const aggregate = await this.prisma.review.aggregate({
      where: { courseId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await this.prisma.course.update({
      where: { id: courseId },
      data: {
        averageRating: aggregate._avg.rating ?? 0,
        totalReviews: aggregate._count.rating,
      },
    });
  }
}
