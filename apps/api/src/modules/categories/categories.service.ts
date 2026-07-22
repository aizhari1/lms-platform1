import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCategoryDto) {
    const existing = await this.prisma.category.findUnique({
      where: { slug: dto.slug },
    });
    if (existing) {
      throw new ConflictException('A category with this slug already exists');
    }

    if (dto.parentId) {
      await this.ensureParentExists(dto.parentId);
    }

    return this.prisma.category.create({ data: dto });
  }

  /**
   * Returns the full category tree (top-level categories with nested
   * children) — used for navigation menus and the course filter sidebar.
   */
  async findTree(includeInactive = false) {
    return this.prisma.category.findMany({
      where: {
        parentId: null,
        ...(includeInactive ? {} : { isActive: true }),
      },
      orderBy: { order: 'asc' },
      include: {
        children: {
          where: includeInactive ? {} : { isActive: true },
          orderBy: { order: 'asc' },
          include: { _count: { select: { courses: true } } },
        },
        _count: { select: { courses: true } },
      },
    });
  }

  async findOneBySlug(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: { children: true, _count: { select: { courses: true } } },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  async findOneOrThrow(id: string) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.findOneOrThrow(id);

    if (dto.parentId === id) {
      throw new BadRequestException('A category cannot be its own parent');
    }
    if (dto.parentId) {
      await this.ensureParentExists(dto.parentId);
    }

    if (dto.slug) {
      const existing = await this.prisma.category.findFirst({
        where: { slug: dto.slug, NOT: { id } },
      });
      if (existing) {
        throw new ConflictException('A category with this slug already exists');
      }
    }

    return this.prisma.category.update({ where: { id }, data: dto });
  }

  async remove(id: string): Promise<void> {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { courses: true, children: true } } },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (category._count.courses > 0) {
      throw new BadRequestException(
        'Cannot delete a category that still has courses assigned to it',
      );
    }
    if (category._count.children > 0) {
      throw new BadRequestException(
        'Cannot delete a category that has subcategories. Delete or reassign them first.',
      );
    }

    await this.prisma.category.delete({ where: { id } });
  }

  private async ensureParentExists(parentId: string): Promise<void> {
    const parent = await this.prisma.category.findUnique({
      where: { id: parentId },
    });
    if (!parent) {
      throw new BadRequestException('Parent category does not exist');
    }
  }
}
