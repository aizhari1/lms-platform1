import { DashboardTopbar } from '@/components/dashboard/student/topbar';
import { CourseAnalyticsClient } from '@/components/dashboard/teacher/course-analytics-client';

export default async function CourseAnalyticsPage({
  params,
}: {
  params: Promise<{ locale: string; courseId: string }>;
}) {
  const { locale, courseId } = await params;

  return (
    <>
      <DashboardTopbar locale={locale} title="إحصائيات الكورس" />
      <CourseAnalyticsClient courseId={courseId} />
    </>
  );
}
