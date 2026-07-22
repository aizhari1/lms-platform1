import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CourseStatus, Prisma, Role } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateCourseDto,
  QueryCoursesDto,
  UpdateCourseDto,
} from './dto/course.dto';
import { slugify } from '../../common/utils/slugify';
import {
  buildPaginatedResult,
  PaginatedResult,
} from '../../common/dto/paginated-result';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { SearchService } from '../search/search.service';
import { CacheService } from '../cache/cache.service';

const COURSE_CARD_SELECT = {
  id: true,
  slug: true,
  titleAr: true,
  titleEn: true,
  subtitleAr: true,
  thumbnailUrl: true,
  price: true,
  discountPrice: true,
  currency: true,
  level: true,
  status: true,
  averageRating: true,
  totalReviews: true,
  totalStudents: true,
  totalDurationSec: true,
  publishedAt: true,
  teacher: {
    select: { id: true, fullName: true, avatarUrl: true },
  },
  category: {
    select: { id: true, nameAr: true, nameEn: true, slug: true },
  },
} satisfies Prisma.CourseSelect;

@Injectable()
export class CoursesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly searchService: SearchService,
    private readonly cache: CacheService,
  ) {}

  // -----------------------------------------------------------------
  // CREATE (Teacher / Admin)
  // -----------------------------------------------------------------
  async create(teacherId: string, dto: CreateCourseDto) {
    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
    });
    if (!category) {
      throw new BadRequestException('Selected category does not exist');
    }

    const slug = slugify(dto.titleAr);

    return this.prisma.course.create({
      data: {
        ...dto,
        slug,
        teacherId,
        status: CourseStatus.DRAFT,
      },
    });
  }

  // -----------------------------------------------------------------
  // PUBLIC LISTING (Marketing site / course catalog)
  // -----------------------------------------------------------------
  async findPublished(
    query: QueryCoursesDto,
  ): Promise<PaginatedResult<unknown>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 12;

    // Redis Caching: the catalog is read constantly and changes rarely
    // (only on publish/update), so cache each distinct filter/sort/page
    // combination for a short window instead of hitting Postgres every time.
    const cacheKey = `courses:list:${JSON.stringify(query)}`;
    const cached = await this.cache.get<PaginatedResult<unknown>>(cacheKey);
    if (cached) return cached;

    const where: Prisma.CourseWhereInput = {
      status: CourseStatus.PUBLISHED,
      deletedAt: null,
      ...(query.categorySlug
        ? { category: { slug: query.categorySlug } }
        : {}),
      ...(query.level ? { level: query.level } : {}),
      ...(query.teacherId ? { teacherId: query.teacherId } : {}),
      ...(query.search
        ? {
            OR: [
              { titleAr: { contains: query.search, mode: 'insensitive' } },
              { titleEn: { contains: query.search, mode: 'insensitive' } },
              { tags: { has: query.search } },
            ],
          }
        : {}),
      ...(query.minPrice !== undefined || query.maxPrice !== undefined
        ? {
            price: {
              ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}),
              ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}),
            },
          }
        : {}),
    };

    const orderBy: Prisma.CourseOrderByWithRelationInput =
      this.resolveSortOrder(query.sort);

    const [items, totalItems] = await Promise.all([
      this.prisma.course.findMany({
        where,
        select: COURSE_CARD_SELECT,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.course.count({ where }),
    ]);

    const result = buildPaginatedResult(items, totalItems, page, limit);
    await this.cache.set(cacheKey, result, 120); // 2 minutes — catalog pages tolerate slight staleness
    return result;
  }

  private resolveSortOrder(
    sort?: QueryCoursesDto['sort'],
  ): Prisma.CourseOrderByWithRelationInput {
    switch (sort) {
      case 'price_asc':
        return { price: 'asc' };
      case 'price_desc':
        return { price: 'desc' };
      case 'top_rated':
        return { averageRating: 'desc' };
      case 'most_popular':
        return { totalStudents: 'desc' };
      case 'newest':
      default:
        return { publishedAt: 'desc' };
    }
  }

  // -----------------------------------------------------------------
  // PUBLIC DETAIL (course overview page)
  // -----------------------------------------------------------------
  async findPublishedBySlug(slug: string) {
    const cacheKey = `courses:detail:${slug}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const course = await this.prisma.course.findFirst({
      where: { slug, status: CourseStatus.PUBLISHED, deletedAt: null },
      include: {
        teacher: {
          select: { id: true, fullName: true, avatarUrl: true, bio: true },
        },
        category: true,
        chapters: {
          orderBy: { order: 'asc' },
          include: {
            lessons: {
              orderBy: { order: 'asc' },
              select: {
                id: true,
                titleAr: true,
                type: true,
                isFreePreview: true,
                videoDurationSec: true,
                order: true,
              },
            },
          },
        },
        reviews: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            student: { select: { fullName: true, avatarUrl: true } },
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    await this.cache.set(cacheKey, course, 300); // 5 minutes
    return course;
  }

  /**
   * Related Courses: other published courses in the same category,
   * ranked by rating, excluding the current one.
   */
  async findRelated(courseId: string, take = 6) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { categoryId: true },
    });
    if (!course) return [];

    return this.prisma.course.findMany({
      where: {
        categoryId: course.categoryId,
        status: CourseStatus.PUBLISHED,
        deletedAt: null,
        id: { not: courseId },
      },
      orderBy: { averageRating: 'desc' },
      take,
      select: COURSE_CARD_SELECT,
    });
  }

  // -----------------------------------------------------------------
  // OWNERSHIP-AWARE FETCH (for teacher dashboard / editing)
  // -----------------------------------------------------------------
  async findOneForOwner(courseId: string, user: AuthenticatedUser) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        category: true,
        chapters: { orderBy: { order: 'asc' }, include: { lessons: true } },
      },
    });

    if (!course || course.deletedAt) {
      throw new NotFoundException('Course not found');
    }

    this.assertOwnershipOrAdmin(course.teacherId, user);
    return course;
  }

  // -----------------------------------------------------------------
  // UPDATE
  // -----------------------------------------------------------------
  async update(
    courseId: string,
    user: AuthenticatedUser,
    dto: UpdateCourseDto,
  ) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course || course.deletedAt) {
      throw new NotFoundException('Course not found');
    }

    this.assertOwnershipOrAdmin(course.teacherId, user);

    if (dto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: dto.categoryId },
      });
      if (!category) {
        throw new BadRequestException('Selected category does not exist');
      }
    }

    const updated = await this.prisma.course.update({
      where: { id: courseId },
      data: dto,
    });
    await this.cache.delByPrefix('courses:');
    return updated;
  }

  // -----------------------------------------------------------------
  // PUBLISHING WORKFLOW
  // -----------------------------------------------------------------
  async submitForReview(courseId: string, user: AuthenticatedUser) {
    const course = await this.getOwnedCourseOrThrow(courseId, user);

    const chapterCount = await this.prisma.chapter.count({
      where: { courseId },
    });
    if (chapterCount === 0) {
      throw new BadRequestException(
        'Add at least one chapter with lessons before submitting for review',
      );
    }

    if (course.status !== CourseStatus.DRAFT && course.status !== CourseStatus.REJECTED) {
      throw new BadRequestException(
        'Only draft or rejected courses can be submitted for review',
      );
    }

    return this.prisma.course.update({
      where: { id: courseId },
      data: { status: CourseStatus.PENDING_REVIEW },
    });
  }

  async approve(courseId: string): Promise<unknown> {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const updated = await this.prisma.course.update({
      where: { id: courseId },
      data: { status: CourseStatus.PUBLISHED, publishedAt: new Date() },
    });

    await this.searchService.syncCourse(courseId);
    await this.cache.delByPrefix('courses:');
    return updated;
  }

  async reject(courseId: string): Promise<unknown> {
    return this.prisma.course.update({
      where: { id: courseId },
      data: { status: CourseStatus.REJECTED },
    });
  }

  async archive(courseId: string, user: AuthenticatedUser) {
    await this.getOwnedCourseOrThrow(courseId, user);
    const updated = await this.prisma.course.update({
      where: { id: courseId },
      data: { status: CourseStatus.ARCHIVED },
    });
    await this.searchService.removeCourse(courseId);
    return updated;
  }

  // -----------------------------------------------------------------
  // DELETE (soft)
  // -----------------------------------------------------------------
  async remove(courseId: string, user: AuthenticatedUser): Promise<void> {
    await this.getOwnedCourseOrThrow(courseId, user);
    await this.prisma.course.update({
      where: { id: courseId },
      data: { deletedAt: new Date(), status: CourseStatus.ARCHIVED },
    });
  }

  // -----------------------------------------------------------------
  // TEACHER DASHBOARD LIST
  // -----------------------------------------------------------------
  async findAllForTeacher(teacherId: string) {
    return this.prisma.course.findMany({
      where: { teacherId, deletedAt: null },
      select: COURSE_CARD_SELECT,
      orderBy: { updatedAt: 'desc' },
    });
  }

  // -----------------------------------------------------------------
  // ADMIN MODERATION QUEUE
  // -----------------------------------------------------------------
  async findPendingReview() {
    return this.prisma.course.findMany({
      where: { status: CourseStatus.PENDING_REVIEW },
      select: COURSE_CARD_SELECT,
      orderBy: { createdAt: 'asc' },
    });
  }

  // -----------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------
  private async getOwnedCourseOrThrow(
    courseId: string,
    user: AuthenticatedUser,
  ) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course || course.deletedAt) {
      throw new NotFoundException('Course not found');
    }
    this.assertOwnershipOrAdmin(course.teacherId, user);
    return course;
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
