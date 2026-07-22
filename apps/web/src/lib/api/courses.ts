import { apiClient } from './client';

export interface CourseCardData {
  id: string;
  slug: string;
  titleAr: string;
  titleEn: string | null;
  subtitleAr: string | null;
  thumbnailUrl: string | null;
  price: string;
  discountPrice: string | null;
  currency: string;
  level: string;
  averageRating: string;
  totalReviews: number;
  totalStudents: number;
  totalDurationSec: number;
  teacher: { id: string; fullName: string; avatarUrl: string | null };
  category: { id: string; nameAr: string; nameEn: string; slug: string };
}

export interface PaginatedCourses {
  items: CourseCardData[];
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export async function fetchCourses(params?: {
  page?: number;
  limit?: number;
  search?: string;
  categorySlug?: string;
  level?: string;
  sort?: string;
}): Promise<PaginatedCourses> {
  const { data } = await apiClient.get<{ data: PaginatedCourses }>('/courses', {
    params,
  });
  return data.data;
}

export async function fetchCourseBySlug(slug: string) {
  const { data } = await apiClient.get(`/courses/slug/${slug}`);
  return data.data;
}

export async function fetchCategoryTree() {
  const { data } = await apiClient.get('/categories');
  return data.data;
}
