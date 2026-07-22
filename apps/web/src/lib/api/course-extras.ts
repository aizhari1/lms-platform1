import { apiClient } from './client';

export interface RelatedCourse {
  id: string;
  slug: string;
  titleAr: string;
  titleEn: string | null;
  thumbnailUrl: string | null;
  price: string;
  discountPrice: string | null;
  currency: string;
  averageRating: string;
  totalStudents: number;
}

export interface CourseFaq {
  id: string;
  questionAr: string;
  answerAr: string;
  order: number;
}

export interface CourseAnnouncement {
  id: string;
  titleAr: string;
  bodyAr: string;
  createdAt: string;
}

export async function fetchRelatedCourses(courseId: string): Promise<RelatedCourse[]> {
  const { data } = await apiClient.get(`/courses/${courseId}/related`);
  return data.data;
}

export async function fetchCourseFaqs(courseId: string): Promise<CourseFaq[]> {
  const { data } = await apiClient.get(`/courses/${courseId}/faqs`);
  return data.data;
}

export async function fetchCourseAnnouncements(courseId: string): Promise<CourseAnnouncement[]> {
  const { data } = await apiClient.get(`/courses/${courseId}/announcements`);
  return data.data;
}
