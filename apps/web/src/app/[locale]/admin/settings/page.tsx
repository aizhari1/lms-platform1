import { DashboardTopbar } from '@/components/dashboard/student/topbar';
import { CmsManagementClient } from '@/components/dashboard/admin/cms-management-client';

export default async function AdminSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <>
      <DashboardTopbar locale={locale} title="إعدادات المنصة والصفحات" />
      <CmsManagementClient />
    </>
  );
}
