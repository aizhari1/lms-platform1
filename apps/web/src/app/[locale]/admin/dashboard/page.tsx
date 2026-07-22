import { DashboardTopbar } from '@/components/dashboard/student/topbar';
import { AdminOverviewClient } from '@/components/dashboard/admin/overview-client';

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <>
      <DashboardTopbar locale={locale} title="لوحة تحكم الأدمن" />
      <AdminOverviewClient />
    </>
  );
}
