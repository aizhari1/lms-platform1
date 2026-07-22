import { apiClient } from './client';

export interface ResourceItem {
  id: string;
  titleAr: string;
  fileUrl: string;
  fileType: string;
  fileSizeKb: number | null;
  isSaved?: boolean;
  lesson: { id: string; titleAr: string };
  course?: { id: string; slug: string; titleAr: string };
}

export async function fetchDownloadCenter(): Promise<ResourceItem[]> {
  const { data } = await apiClient.get('/downloads');
  return data.data;
}

export async function fetchCourseResources(courseId: string): Promise<ResourceItem[]> {
  const { data } = await apiClient.get(`/courses/${courseId}/resources`);
  return data.data;
}

export async function fetchSavedResources(): Promise<ResourceItem[]> {
  const { data } = await apiClient.get('/resources/saved');
  return data.data;
}

export async function saveResource(resourceId: string) {
  await apiClient.post(`/resources/${resourceId}/save`);
}

export async function unsaveResource(resourceId: string) {
  await apiClient.delete(`/resources/${resourceId}/save`);
}
