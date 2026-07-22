import { DashboardTopbar } from '@/components/dashboard/student/topbar';
import { CouponsManagementClient } from '@/components/dashboard/admin/coupons-management-client';

export default async function AdminCouponsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <>
      <DashboardTopbar locale={locale} title="الكوبونات" />
      <CouponsManagementClient />
    </>
  );
}
