import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CouponType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class CouponsService {
  constructor(private readonly prisma: PrismaService) {}

  // -----------------------------------------------------------------
  // ADMIN CRUD
  // -----------------------------------------------------------------
  async create(dto: {
    code: string;
    type: CouponType;
    value: number;
    maxUses?: number;
    minOrderAmount?: number;
    courseId?: string;
    validUntil?: string;
  }) {
    const existing = await this.prisma.coupon.findUnique({ where: { code: dto.code } });
    if (existing) {
      throw new BadRequestException('A coupon with this code already exists');
    }

    return this.prisma.coupon.create({
      data: {
        code: dto.code.toUpperCase(),
        type: dto.type,
        value: dto.value,
        maxUses: dto.maxUses,
        minOrderAmount: dto.minOrderAmount,
        courseId: dto.courseId,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
      },
    });
  }

  async findAll() {
    return this.prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
      include: { course: { select: { titleAr: true } } },
    });
  }

  async toggleActive(id: string) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }
    return this.prisma.coupon.update({
      where: { id },
      data: { isActive: !coupon.isActive },
    });
  }

  async remove(id: string): Promise<void> {
    await this.prisma.coupon.delete({ where: { id } });
  }

  /**
   * Validates a coupon against a specific course/order amount and
   * returns the calculated discount. Does NOT increment usedCount —
   * that only happens once the order is actually paid (see PaymentsService).
   */
  async validateAndCalculateDiscount(
    code: string,
    courseId: string,
    subtotal: number,
  ): Promise<{ coupon: { id: string }; discountAmount: number }> {
    const coupon = await this.prisma.coupon.findUnique({ where: { code } });

    if (!coupon || !coupon.isActive) {
      throw new NotFoundException('Invalid or inactive coupon code');
    }
    if (coupon.courseId && coupon.courseId !== courseId) {
      throw new BadRequestException('This coupon is not valid for this course');
    }
    if (coupon.validUntil && coupon.validUntil < new Date()) {
      throw new BadRequestException('This coupon has expired');
    }
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      throw new BadRequestException('This coupon has reached its usage limit');
    }
    if (coupon.minOrderAmount && subtotal < Number(coupon.minOrderAmount)) {
      throw new BadRequestException(
        `This coupon requires a minimum order of ${coupon.minOrderAmount}`,
      );
    }

    const discountAmount =
      coupon.type === CouponType.PERCENTAGE
        ? (subtotal * Number(coupon.value)) / 100
        : Number(coupon.value);

    return {
      coupon: { id: coupon.id },
      discountAmount: Math.min(discountAmount, subtotal),
    };
  }

  async previewForCourse(code: string, courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { price: true, discountPrice: true },
    });
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    const subtotal = Number(course.discountPrice ?? course.price);
    return this.validateAndCalculateDiscount(code, courseId, subtotal);
  }

  async incrementUsage(couponId: string): Promise<void> {
    await this.prisma.coupon.update({
      where: { id: couponId },
      data: { usedCount: { increment: 1 } },
    });
  }

  /** Coupon Analytics: usage + revenue impact per coupon. */
  async getAnalytics() {
    const coupons = await this.prisma.coupon.findMany({
      include: {
        course: { select: { titleAr: true } },
        orders: {
          where: { status: 'PAID' },
          select: { discountAmount: true, totalAmount: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return coupons.map((coupon) => {
      const paidOrders = coupon.orders;
      const totalDiscountGiven = paidOrders.reduce((sum, o) => sum + Number(o.discountAmount), 0);
      const totalRevenueGenerated = paidOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);

      return {
        id: coupon.id,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        isActive: coupon.isActive,
        course: coupon.course,
        usedCount: coupon.usedCount,
        maxUses: coupon.maxUses,
        redemptions: paidOrders.length,
        totalDiscountGiven,
        totalRevenueGenerated,
      };
    });
  }
}


