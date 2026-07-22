import { apiClient } from './client';

export interface MyEnrollment {
  id: string;
  progressPct: string;
  completedAt: string | null;
  enrolledAt: string;
  course: {
    id: string;
    slug: string;
    titleAr: string;
    titleEn: string | null;
    thumbnailUrl: string | null;
    totalDurationSec: number;
    teacher: { fullName: string };
  };
}

export async function fetchMyEnrollments(): Promise<MyEnrollment[]> {
  const { data } = await apiClient.get('/enrollments/my-courses');
  return data.data;
}

export async function fetchMyCertificates() {
  const { data } = await apiClient.get('/certificates/my-certificates');
  return data.data;
}

export async function fetchUnreadNotificationsCount(): Promise<number> {
  const { data } = await apiClient.get('/notifications/unread-count');
  return data.data;
}

export async function fetchMyWishlist() {
  const { data } = await apiClient.get('/wishlist');
  return data.data;
}
