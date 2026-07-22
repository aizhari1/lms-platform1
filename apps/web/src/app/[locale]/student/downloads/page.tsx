import { DashboardTopbar } from '@/components/dashboard/student/topbar';
import { DownloadCenterClient } from '@/components/dashboard/student/download-center-client';

export default async function DownloadsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <>
      <DashboardTopbar locale={locale} title="مركز التنزيلات" />
      <DownloadCenterClient locale={locale} />
    </>
  );
}
