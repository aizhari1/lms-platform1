import { apiClient } from './client';

export interface TimelineLesson {
  lessonId: string;
  titleAr: string;
  type: string;
  isCompleted: boolean;
  completedAt: string | null;
}

export interface TimelineChapter {
  chapterId: string;
  chapterTitle: string;
  lessons: TimelineLesson[];
}

export async function fetchCourseCompletionTimeline(
  courseId: string,
): Promise<TimelineChapter[]> {
  const { data } = await apiClient.get(`/courses/${courseId}/completion-timeline`);
  return data.data;
}
