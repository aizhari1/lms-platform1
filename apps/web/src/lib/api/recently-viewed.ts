import { apiClient } from './client';

export interface RecentlyViewedItem {
  viewedAt: string;
  course: {
    id: string;
    slug: string;
    titleAr: string;
    titleEn: string | null;
    thumbnailUrl: string | null;
    price: string;
    averageRating: string;
  };
}

export async function recordCourseView(courseId: string) {
  await apiClient.post(`/courses/${courseId}/view`).catch(() => undefined);
}

export async function fetchRecentlyViewed(): Promise<RecentlyViewedItem[]> {
  const { data } = await apiClient.get('/recently-viewed');
  return data.data;
}
