import { apiClient } from './client';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
  avatarUrl: string | null;
}

interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

interface TwoFactorChallengeResponse {
  requires2fa: true;
  challengeToken: string;
}

export async function loginRequest(
  email: string,
  password: string,
): Promise<AuthResponse | TwoFactorChallengeResponse> {
  const { data } = await apiClient.post<{ data: AuthResponse | TwoFactorChallengeResponse }>(
    '/auth/login',
    { email, password },
  );
  return data.data;
}

export async function verify2faLoginRequest(challengeToken: string, code: string) {
  const { data } = await apiClient.post<{ data: AuthResponse }>('/auth/login/2fa-verify', {
    challengeToken,
    code,
  });
  return data.data;
}

export async function registerRequest(params: {
  fullName: string;
  email: string;
  password: string;
  role?: 'STUDENT' | 'TEACHER';
}) {
  const { data } = await apiClient.post<{ data: AuthResponse }>(
    '/auth/register',
    params,
  );
  return data.data;
}

export async function forgotPasswordRequest(email: string): Promise<{ message: string }> {
  const { data } = await apiClient.post<{ data: { message: string } }>(
    '/auth/forgot-password',
    { email },
  );
  return data.data;
}

export function persistSession(auth: AuthResponse): void {
  sessionStorage.setItem('accessToken', auth.accessToken);
  sessionStorage.setItem('refreshToken', auth.refreshToken);
  sessionStorage.setItem('user', JSON.stringify(auth.user));
}

export function clearSession(): void {
  sessionStorage.removeItem('accessToken');
  sessionStorage.removeItem('refreshToken');
  sessionStorage.removeItem('user');
}
