import { DashboardTopbar } from '@/components/dashboard/student/topbar';
import { EarningsClient } from '@/components/dashboard/teacher/earnings-client';

export default async function EarningsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <>
      <DashboardTopbar locale={locale} title="أرباحي" />
      <EarningsClient />
    </>
  );
}
