import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import algoliasearch, { SearchIndex } from 'algoliasearch';
import { PrismaService } from '../../database/prisma.service';

interface CourseSearchRecord {
  objectID: string;
  titleAr: string;
  titleEn: string | null;
  slug: string;
  thumbnailUrl: string | null;
  price: number;
  discountPrice: number | null;
  level: string;
  averageRating: number;
  totalStudents: number;
  categoryName: string;
  teacherName: string;
  tags: string[];
}

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);
  private index?: SearchIndex;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    const appId = this.config.get<string>('ALGOLIA_APP_ID');
    const adminKey = this.config.get<string>('ALGOLIA_ADMIN_API_KEY');

    if (appId && adminKey) {
      const client = algoliasearch(appId, adminKey);
      this.index = client.initIndex(
        this.config.get<string>('ALGOLIA_COURSES_INDEX', 'courses'),
      );
    } else {
      this.logger.warn('Algolia credentials not set — search sync is disabled');
    }
  }

  /**
   * Pushes (or updates) a single published course into the Algolia index.
   * Called whenever a course is approved/updated. Unpublished/archived
   * courses are removed from the index so they never appear in search.
   */
  async syncCourse(courseId: string): Promise<void> {
    if (!this.index) return;

    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: { category: true, teacher: { select: { fullName: true } } },
    });

    if (!course || course.status !== 'PUBLISHED' || course.deletedAt) {
      await this.removeCourse(courseId);
      return;
    }

    const record: CourseSearchRecord = {
      objectID: course.id,
      titleAr: course.titleAr,
      titleEn: course.titleEn,
      slug: course.slug,
      thumbnailUrl: course.thumbnailUrl,
      price: Number(course.price),
      discountPrice: course.discountPrice ? Number(course.discountPrice) : null,
      level: course.level,
      averageRating: Number(course.averageRating),
      totalStudents: course.totalStudents,
      categoryName: course.category.nameAr,
      teacherName: course.teacher.fullName,
      tags: course.tags,
    };

    try {
      await this.index.saveObject(record);
    } catch (error) {
      this.logger.error(`Failed to sync course ${courseId} to Algolia`, error as Error);
    }
  }

  async removeCourse(courseId: string): Promise<void> {
    if (!this.index) return;
    try {
      await this.index.deleteObject(courseId);
    } catch (error) {
      this.logger.error(`Failed to remove course ${courseId} from Algolia`, error as Error);
    }
  }

  /**
   * Full reindex — run manually (e.g. via a CLI script or admin button)
   * after bulk data changes or when first setting up Algolia.
   */
  async reindexAllPublishedCourses(): Promise<number> {
    if (!this.index) return 0;

    const courses = await this.prisma.course.findMany({
      where: { status: 'PUBLISHED', deletedAt: null },
      select: { id: true },
    });

    await Promise.all(courses.map((c) => this.syncCourse(c.id)));
    return courses.length;
  }
}
