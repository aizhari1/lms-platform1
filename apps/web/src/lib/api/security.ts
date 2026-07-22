import { apiClient } from './client';

export interface LoginHistoryEntry {
  action: 'LOGIN' | 'LOGOUT';
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface ActiveSession {
  id: string;
  deviceLabel: string;
  ipAddress: string | null;
  lastUsedAt: string;
  createdAt: string;
  isCurrent: boolean;
}

export interface TrustedDevice {
  id: string;
  label: string;
  lastUsedAt: string;
  expiresAt: string;
}

export async function fetchLoginHistory(): Promise<LoginHistoryEntry[]> {
  const { data } = await apiClient.get('/security/login-history');
  return data.data;
}

export async function fetchActiveSessions(): Promise<ActiveSession[]> {
  const { data } = await apiClient.get('/security/sessions');
  return data.data;
}

export async function revokeSession(sessionId: string) {
  await apiClient.delete(`/security/sessions/${sessionId}`);
}

export async function revokeOtherSessions() {
  await apiClient.post('/security/sessions/revoke-others');
}

export async function fetchTrustedDevices(): Promise<TrustedDevice[]> {
  const { data } = await apiClient.get('/security/trusted-devices');
  return data.data;
}

export async function removeTrustedDevice(deviceId: string) {
  await apiClient.delete(`/security/trusted-devices/${deviceId}`);
}

export async function setup2fa(): Promise<{ secret: string; qrCodeDataUrl: string }> {
  const { data } = await apiClient.post('/security/2fa/setup');
  return data.data;
}

export async function enable2fa(code: string): Promise<{ backupCodes: string[] }> {
  const { data } = await apiClient.post('/security/2fa/enable', { code });
  return data.data;
}

export async function disable2fa(code: string) {
  await apiClient.post('/security/2fa/disable', { code });
}
