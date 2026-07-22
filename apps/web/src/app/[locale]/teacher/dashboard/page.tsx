import { DashboardTopbar } from '@/components/dashboard/student/topbar';
import { TeacherDashboardHomeClient } from '@/components/dashboard/teacher/dashboard-home-client';

export default async function TeacherDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <>
      <DashboardTopbar locale={locale} title="مرحبًا بك 👋" />
      <TeacherDashboardHomeClient locale={locale} />
    </>
  );
}
