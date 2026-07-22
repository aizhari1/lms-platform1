import { DashboardTopbar } from '@/components/dashboard/student/topbar';
import { AssignmentsClient } from '@/components/dashboard/student/assignments-client';

export default async function AssignmentsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <>
      <DashboardTopbar locale={locale} title="الواجبات والامتحانات" />
      <AssignmentsClient />
    </>
  );
}
