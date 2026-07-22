import { DashboardTopbar } from '@/components/dashboard/student/topbar';
import { TeacherAnalyticsClient } from '@/components/dashboard/teacher/teacher-analytics-client';

export default async function TeacherAnalyticsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <>
      <DashboardTopbar locale={locale} title="التحليلات والتقارير" />
      <TeacherAnalyticsClient />
    </>
  );
}
