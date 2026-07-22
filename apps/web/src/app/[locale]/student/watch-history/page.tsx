import { DashboardTopbar } from '@/components/dashboard/student/topbar';
import { WatchHistoryClient } from '@/components/dashboard/student/watch-history-client';

export default async function WatchHistoryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <>
      <DashboardTopbar locale={locale} title="سجل المشاهدة" />
      <WatchHistoryClient locale={locale} />
    </>
  );
}
