import { apiClient } from './client';

export type ChannelToggles = { inApp: boolean; email: boolean; push: boolean };
export type NotificationPrefs = Record<string, ChannelToggles>;

export const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  SYSTEM: 'إشعارات النظام',
  COURSE_UPDATE: 'تحديثات الكورسات',
  PAYMENT: 'المدفوعات والفواتير',
  EXAM: 'الامتحانات والواجبات',
  CERTIFICATE: 'الشهادات',
  COMMENT_REPLY: 'الردود على تعليقاتي',
  ANNOUNCEMENT: 'الإعلانات',
  MESSAGE: 'الرسائل',
};

export async function fetchNotificationPreferences(): Promise<NotificationPrefs> {
  const { data } = await apiClient.get('/notifications/preferences');
  return data.data;
}

export async function updateNotificationPreferences(
  preferences: Partial<NotificationPrefs>,
): Promise<NotificationPrefs> {
  const { data } = await apiClient.patch('/notifications/preferences', { preferences });
  return data.data;
}
