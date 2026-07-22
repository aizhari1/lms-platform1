import { DashboardTopbar } from '@/components/dashboard/student/topbar';
import { UsersManagementClient } from '@/components/dashboard/admin/users-management-client';

export default async function AdminUsersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <>
      <DashboardTopbar locale={locale} title="إدارة المستخدمين" />
      <UsersManagementClient />
    </>
  );
}
