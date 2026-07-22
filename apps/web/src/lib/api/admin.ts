import { apiClient } from './client';

// -----------------------------------------------------------------
// Analytics
// -----------------------------------------------------------------
export async function fetchAdminOverview() {
  const { data } = await apiClient.get('/admin/analytics/overview');
  return data.data;
}

export async function fetchRevenueChart(days = 30) {
  const { data } = await apiClient.get('/admin/analytics/revenue', { params: { days } });
  return data.data;
}

export async function fetchTopCourses(limit = 5) {
  const { data } = await apiClient.get('/admin/analytics/top-courses', { params: { limit } });
  return data.data;
}

export async function fetchUserGrowth(days = 30) {
  const { data } = await apiClient.get('/admin/analytics/user-growth', { params: { days } });
  return data.data;
}

// -----------------------------------------------------------------
// Users
// -----------------------------------------------------------------
export async function fetchUsers(params: {
  page?: number;
  search?: string;
  role?: string;
  status?: string;
}) {
  const { data } = await apiClient.get('/users', { params });
  return data.data;
}

export async function updateUserStatus(userId: string, status: string) {
  const { data } = await apiClient.patch(`/users/${userId}/status`, { status });
  return data.data;
}

export async function updateUserRole(userId: string, role: string) {
  const { data } = await apiClient.patch(`/users/${userId}/role`, { role });
  return data.data;
}

// -----------------------------------------------------------------
// Course moderation
// -----------------------------------------------------------------
export async function fetchPendingCourses() {
  const { data } = await apiClient.get('/courses/admin/pending-review');
  return data.data;
}

export async function approveCourse(courseId: string) {
  const { data } = await apiClient.patch(`/courses/${courseId}/approve`);
  return data.data;
}

export async function rejectCourse(courseId: string) {
  const { data } = await apiClient.patch(`/courses/${courseId}/reject`);
  return data.data;
}

// -----------------------------------------------------------------
// Categories
// -----------------------------------------------------------------
export async function createCategory(payload: Record<string, unknown>) {
  const { data } = await apiClient.post('/categories', payload);
  return data.data;
}

export async function deleteCategory(id: string) {
  await apiClient.delete(`/categories/${id}`);
}
