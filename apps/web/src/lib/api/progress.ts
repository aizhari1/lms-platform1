import { apiClient } from './client';

export interface ContinueWatchingItem {
  lessonId: string;
  lastPositionSec: number;
  videoDurationSec: number | null;
  updatedAt: string;
  lesson: { id: string; titleAr: string; titleEn: string | null };
  course: {
    id: string;
    slug: string;
    titleAr: string;
    titleEn: string | null;
    thumbnailUrl: string | null;
  };
}

export interface WatchHistoryItem extends ContinueWatchingItem {
  isCompleted: boolean;
  watchedSeconds: number;
  completedAt: string | null;
}

export async function fetchContinueWatching(): Promise<ContinueWatchingItem[]> {
  const { data } = await apiClient.get('/progress/continue-watching');
  return data.data;
}

export async function fetchWatchHistory(): Promise<WatchHistoryItem[]> {
  const { data } = await apiClient.get('/progress/watch-history');
  return data.data;
}
