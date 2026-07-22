import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// -----------------------------------------------------------------
// Attach the access token from client-side storage on every request.
// Tokens are kept in memory + a short-lived cookie (set by the auth
// callbacks), never in localStorage, to reduce XSS exposure.
// -----------------------------------------------------------------
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const token = sessionStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// -----------------------------------------------------------------
// On 401, attempt a single silent refresh using the refresh token,
// then retry the original request once. Avoids infinite retry loops.
// -----------------------------------------------------------------
let isRefreshing = false;
let pendingQueue: Array<(token: string) => void> = [];

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (typeof window === 'undefined') {
      return Promise.reject(error);
    }

    const refreshToken = sessionStorage.getItem('refreshToken');
    if (!refreshToken) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      return new Promise((resolve) => {
        pendingQueue.push((newToken: string) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          resolve(apiClient(originalRequest));
        });
      });
    }

    isRefreshing = true;
    try {
      const { data } = await axios.post(
        `${apiClient.defaults.baseURL}/auth/refresh`,
        { refreshToken },
      );
      const { accessToken, refreshToken: newRefreshToken } = data.data;

      sessionStorage.setItem('accessToken', accessToken);
      sessionStorage.setItem('refreshToken', newRefreshToken);

      pendingQueue.forEach((cb) => cb(accessToken));
      pendingQueue = [];

      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('refreshToken');
      window.location.href = '/ar/login';
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
