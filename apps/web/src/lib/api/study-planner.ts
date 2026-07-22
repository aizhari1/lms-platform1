import { apiClient } from './client';

export interface StudyPlanItem {
  id: string;
  titleAr: string;
  notes: string | null;
  dueDate: string;
  isCompleted: boolean;
  completedAt: string | null;
  course: { id: string; slug: string; titleAr: string } | null;
}

export interface CalendarEvent {
  id: string;
  type: 'STUDY_TASK' | 'LIVE_SESSION';
  title: string;
  date: string;
  isCompleted: boolean;
  course: { id: string; slug: string; titleAr: string } | null;
  meetingUrl?: string | null;
}

export async function fetchMyStudyPlan(): Promise<StudyPlanItem[]> {
  const { data } = await apiClient.get('/study-plan');
  return data.data;
}

export async function createStudyPlanItem(payload: {
  titleAr: string;
  notes?: string;
  courseId?: string;
  dueDate: string;
}) {
  const { data } = await apiClient.post('/study-plan', payload);
  return data.data;
}

export async function updateStudyPlanItem(
  itemId: string,
  payload: Partial<{ titleAr: string; notes: string; dueDate: string; isCompleted: boolean }>,
) {
  const { data } = await apiClient.patch(`/study-plan/${itemId}`, payload);
  return data.data;
}

export async function deleteStudyPlanItem(itemId: string) {
  await apiClient.delete(`/study-plan/${itemId}`);
}

export async function fetchMyCalendar(from?: string, to?: string): Promise<CalendarEvent[]> {
  const { data } = await apiClient.get('/calendar', { params: { from, to } });
  return data.data;
}
