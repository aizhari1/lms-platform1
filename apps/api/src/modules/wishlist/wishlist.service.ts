import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class WishlistService {
  constructor(private readonly prisma: PrismaService) {}

  async add(studentId: string, courseId: string) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const existing = await this.prisma.wishlist.findUnique({
      where: { studentId_courseId: { studentId, courseId } },
    });
    if (existing) {
      throw new ConflictException('Course is already in your wishlist');
    }

    return this.prisma.wishlist.create({ data: { studentId, courseId } });
  }

  async remove(studentId: string, courseId: string): Promise<void> {
    await this.prisma.wishlist.deleteMany({ where: { studentId, courseId } });
  }

  async findMyWishlist(studentId: string) {
    return this.prisma.wishlist.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      include: {
        course: {
          select: {
            id: true,
            slug: true,
            titleAr: true,
            thumbnailUrl: true,
            price: true,
            discountPrice: true,
            averageRating: true,
            teacher: { select: { fullName: true } },
          },
        },
      },
    });
  }
}
