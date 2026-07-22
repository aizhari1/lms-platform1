import { DashboardTopbar } from '@/components/dashboard/student/topbar';
import { CategoriesManagementClient } from '@/components/dashboard/admin/categories-management-client';

export default async function AdminCategoriesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <>
      <DashboardTopbar locale={locale} title="التصنيفات" />
      <CategoriesManagementClient />
    </>
  );
}
