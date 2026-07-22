import { apiClient } from './client';

export interface RevenueAnalytics {
  totalRevenue: number;
  monthlyTrend: { month: string; amount: number }[];
  byCourse: { courseTitle: string; amount: number }[];
}

export interface StudentAnalytics {
  totalUniqueStudents: number;
  totalEnrollments: number;
  newEnrollmentsTrend: { month: string; count: number }[];
  perCourse: { courseId: string; courseTitle: string; studentCount: number }[];
}

export interface RetentionAnalytics {
  totalEnrollments: number;
  activeStudents: number;
  inactiveStudents: number;
  retentionRatePct: number;
}

export interface CoursePerformanceRow {
  courseId: string;
  courseTitle: string;
  averageRating: string;
  totalReviews: number;
  enrollmentCount: number;
  completedCount: number;
  completionRatePct: number;
  averageProgressPct: number;
}

export interface DashboardWidgets {
  revenueThisMonth: number;
  newStudentsThisWeek: number;
  averageCompletionRatePct: number;
  topCourse: CoursePerformanceRow | null;
  pendingAssignmentReviews: number;
  pendingExamReviews: number;
}

export async function fetchRevenueAnalytics(): Promise<RevenueAnalytics> {
  const { data } = await apiClient.get('/teacher/analytics/revenue');
  return data.data;
}

export async function fetchStudentAnalytics(): Promise<StudentAnalytics> {
  const { data } = await apiClient.get('/teacher/analytics/students');
  return data.data;
}

export async function fetchRetentionAnalytics(): Promise<RetentionAnalytics> {
  const { data } = await apiClient.get('/teacher/analytics/retention');
  return data.data;
}

export async function fetchCoursePerformance(): Promise<CoursePerformanceRow[]> {
  const { data } = await apiClient.get('/teacher/analytics/course-performance');
  return data.data;
}

export async function fetchDashboardWidgets(): Promise<DashboardWidgets> {
  const { data } = await apiClient.get('/teacher/analytics/dashboard-widgets');
  return data.data;
}

async function downloadCsv(path: string, filename: string) {
  const response = await apiClient.get(path, { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
}

export function exportStudentsReport() {
  return downloadCsv('/teacher/analytics/export/students.csv', 'students-report.csv');
}

export function exportRevenueReport() {
  return downloadCsv('/teacher/analytics/export/revenue.csv', 'revenue-report.csv');
}

export async function bulkNotifyCourse(courseId: string, titleAr: string, bodyAr: string) {
  const { data } = await apiClient.post(`/teacher/bulk/courses/${courseId}/notify`, { titleAr, bodyAr });
  return data.data;
}

export async function bulkEmailCourse(courseId: string, subject: string, bodyHtml: string) {
  const { data } = await apiClient.post(`/teacher/bulk/courses/${courseId}/email`, { subject, bodyHtml });
  return data.data;
}
