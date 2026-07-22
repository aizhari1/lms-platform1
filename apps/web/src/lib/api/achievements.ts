import { apiClient } from './client';

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  isActiveToday: boolean;
}

export interface BadgeItem {
  id: string;
  code: string;
  titleAr: string;
  titleEn: string | null;
  descriptionAr: string;
  icon: string;
  isEarned: boolean;
  earnedAt: string | null;
}

export async function fetchMyStreak(): Promise<StreakInfo> {
  const { data } = await apiClient.get('/achievements/streak');
  return data.data;
}

export async function fetchMyBadges(): Promise<BadgeItem[]> {
  const { data } = await apiClient.get('/achievements/badges');
  return data.data;
}
