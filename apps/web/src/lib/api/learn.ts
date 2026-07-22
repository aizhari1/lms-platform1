import { apiClient } from './client';

export async function fetchLessonToWatch(lessonId: string) {
  const { data } = await apiClient.get(`/lessons/${lessonId}/watch`);
  return data.data;
}

export async function fetchCourseProgress(courseId: string) {
  const { data } = await apiClient.get(`/courses/${courseId}/progress`);
  return data.data;
}

export async function updateLessonProgress(
  lessonId: string,
  payload: { lastPositionSec: number; watchedSeconds?: number; isCompleted?: boolean },
) {
  const { data } = await apiClient.patch(`/lessons/${lessonId}/progress`, payload);
  return data.data;
}

export async function fetchLessonComments(lessonId: string) {
  const { data } = await apiClient.get(`/comments/lesson/${lessonId}`);
  return data.data;
}

export async function fetchCourseComments(courseId: string) {
  const { data } = await apiClient.get(`/comments/course/${courseId}`);
  return data.data;
}

export async function postComment(payload: {
  content: string;
  lessonId?: string;
  courseId?: string;
  parentId?: string;
}) {
  const { data } = await apiClient.post('/comments', payload);
  return data.data;
}
