import { apiClient } from './client';

export async function fetchMyTeachingCourses() {
  const { data } = await apiClient.get('/courses/my-courses');
  return data.data;
}

export async function createCourse(payload: Record<string, unknown>) {
  const { data } = await apiClient.post('/courses', payload);
  return data.data;
}

export async function fetchCourseForEdit(courseId: string) {
  const { data } = await apiClient.get(`/courses/${courseId}/edit`);
  return data.data;
}

export async function updateCourse(courseId: string, payload: Record<string, unknown>) {
  const { data } = await apiClient.patch(`/courses/${courseId}`, payload);
  return data.data;
}

export async function submitCourseForReview(courseId: string) {
  const { data } = await apiClient.patch(`/courses/${courseId}/submit-for-review`);
  return data.data;
}

export async function fetchCategoryOptions() {
  const { data } = await apiClient.get('/categories');
  return data.data;
}

// -----------------------------------------------------------------
// Chapters & Lessons
// -----------------------------------------------------------------
export async function createChapter(courseId: string, titleAr: string) {
  const { data } = await apiClient.post(`/courses/${courseId}/chapters`, { titleAr });
  return data.data;
}

export async function createLesson(chapterId: string, payload: Record<string, unknown>) {
  const { data } = await apiClient.post(`/chapters/${chapterId}/lessons`, payload);
  return data.data;
}

export async function deleteChapter(chapterId: string, courseId: string) {
  await apiClient.delete(`/courses/${courseId}/chapters/${chapterId}`);
}

export async function deleteLesson(lessonId: string) {
  await apiClient.delete(`/lessons/${lessonId}`);
}

// -----------------------------------------------------------------
// Students & Earnings
// -----------------------------------------------------------------
export async function fetchCourseStudents(courseId: string) {
  const { data } = await apiClient.get(`/enrollments/course/${courseId}/students`);
  return data.data;
}

// -----------------------------------------------------------------
// Uploads (presigned URL flow)
// -----------------------------------------------------------------
export async function requestUploadUrl(payload: {
  fileName: string;
  contentType: string;
  folder: string;
}) {
  const { data } = await apiClient.post('/uploads/presigned-url', payload);
  return data.data as { uploadUrl: string; fileUrl: string; key: string };
}
