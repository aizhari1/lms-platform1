import { apiClient } from './client';

export interface CourseAnalytics {
  totalEnrollments: number;
  completedCount: number;
  completionRatePct: number;
  averageProgressPct: number;
  lessonBreakdown: {
    lessonId: string;
    titleAr: string;
    chapterTitle: string;
    completedCount: number;
    completionRatePct: number;
  }[];
}

export async function fetchCourseAnalytics(courseId: string): Promise<CourseAnalytics> {
  const { data } = await apiClient.get(`/courses/${courseId}/analytics`);
  return data.data;
}
