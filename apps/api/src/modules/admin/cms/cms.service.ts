import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateCmsPageDto, UpdateCmsPageDto } from '../dto/cms-page.dto';

@Injectable()
export class CmsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCmsPageDto) {
    const existing = await this.prisma.cmsPage.findUnique({
      where: { slug: dto.slug },
    });
    if (existing) {
      throw new ConflictException('A page with this slug already exists');
    }
    return this.prisma.cmsPage.create({ data: dto });
  }

  async findAll() {
    return this.prisma.cmsPage.findMany({ orderBy: { updatedAt: 'desc' } });
  }

  async findPublishedBySlug(slug: string) {
    const page = await this.prisma.cmsPage.findFirst({
      where: { slug, isPublished: true },
    });
    if (!page) {
      throw new NotFoundException('Page not found');
    }
    return page;
  }

  async update(id: string, dto: UpdateCmsPageDto) {
    const page = await this.prisma.cmsPage.findUnique({ where: { id } });
    if (!page) {
      throw new NotFoundException('Page not found');
    }
    return this.prisma.cmsPage.update({ where: { id }, data: dto });
  }

  async remove(id: string): Promise<void> {
    await this.prisma.cmsPage.delete({ where: { id } });
  }
}
