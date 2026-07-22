import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateDiscountCampaignDto } from './dto/create-campaign.dto';

@Injectable()
export class DiscountCampaignsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDiscountCampaignDto) {
    return this.prisma.discountCampaign.create({
      data: {
        titleAr: dto.titleAr,
        discountPct: dto.discountPct,
        courseId: dto.courseId,
        startsAt: new Date(dto.startsAt),
        endsAt: new Date(dto.endsAt),
      },
    });
  }

  async findAll() {
    return this.prisma.discountCampaign.findMany({
      orderBy: { startsAt: 'desc' },
      include: { course: { select: { titleAr: true } } },
    });
  }

  async toggleActive(id: string) {
    const campaign = await this.prisma.discountCampaign.findUnique({ where: { id } });
    if (!campaign) throw new NotFoundException('Campaign not found');
    return this.prisma.discountCampaign.update({
      where: { id },
      data: { isActive: !campaign.isActive },
    });
  }

  async remove(id: string) {
    await this.prisma.discountCampaign.delete({ where: { id } });
    return { success: true };
  }

  /**
   * The single best active discount for a course right now — picks
   * whichever gives the bigger cut between a course-specific campaign
   * and a platform-wide one, so they stack sensibly instead of both firing.
   */
  async getActiveDiscountForCourse(courseId: string): Promise<number> {
    const now = new Date();
    const campaigns = await this.prisma.discountCampaign.findMany({
      where: {
        isActive: true,
        startsAt: { lte: now },
        endsAt: { gte: now },
        OR: [{ courseId }, { courseId: null }],
      },
    });
    if (campaigns.length === 0) return 0;
    return Math.max(...campaigns.map((c) => Number(c.discountPct)));
  }

  /** Every course-visible active campaign right now (for a storewide sale banner). */
  async findActive() {
    const now = new Date();
    return this.prisma.discountCampaign.findMany({
      where: { isActive: true, startsAt: { lte: now }, endsAt: { gte: now } },
      include: { course: { select: { id: true, slug: true, titleAr: true } } },
    });
  }
}
