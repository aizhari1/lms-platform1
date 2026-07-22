import { DashboardTopbar } from '@/components/dashboard/student/topbar';
import { DashboardHomeClient } from '@/components/dashboard/student/dashboard-home-client';

export default async function StudentDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <>
      <DashboardTopbar locale={locale} title="مرحبًا بك 👋" />
      <DashboardHomeClient locale={locale} />
    </>
  );
}
