import { apiClient } from './client';

export interface NoteItem {
  id: string;
  content: string;
  timestampSec: number | null;
  createdAt: string;
  updatedAt: string;
  lesson: { id: string; titleAr: string; titleEn: string | null };
  course: { id: string; slug: string; titleAr: string; titleEn: string | null };
}

export interface BookmarkItem {
  id: string;
  timestampSec: number;
  label: string | null;
  createdAt: string;
  lesson: { id: string; titleAr: string; titleEn: string | null };
  course: { id: string; slug: string; titleAr: string; titleEn: string | null };
}

// --- Notes ---------------------------------------------------------

export async function fetchMyNotes(): Promise<NoteItem[]> {
  const { data } = await apiClient.get('/notes');
  return data.data;
}

export async function fetchLessonNotes(lessonId: string) {
  const { data } = await apiClient.get(`/lessons/${lessonId}/notes`);
  return data.data;
}

export async function createNote(payload: {
  lessonId: string;
  content: string;
  timestampSec?: number;
}) {
  const { data } = await apiClient.post('/notes', payload);
  return data.data;
}

export async function updateNote(noteId: string, content: string) {
  const { data } = await apiClient.patch(`/notes/${noteId}`, { content });
  return data.data;
}

export async function deleteNote(noteId: string) {
  await apiClient.delete(`/notes/${noteId}`);
}

// --- Bookmarks -------------------------------------------------------

export async function fetchMyBookmarks(): Promise<BookmarkItem[]> {
  const { data } = await apiClient.get('/bookmarks');
  return data.data;
}

export async function fetchLessonBookmarks(lessonId: string) {
  const { data } = await apiClient.get(`/lessons/${lessonId}/bookmarks`);
  return data.data;
}

export async function createBookmark(payload: {
  lessonId: string;
  timestampSec: number;
  label?: string;
}) {
  const { data } = await apiClient.post('/bookmarks', payload);
  return data.data;
}

export async function deleteBookmark(bookmarkId: string) {
  await apiClient.delete(`/bookmarks/${bookmarkId}`);
}
