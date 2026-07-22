import { DashboardTopbar } from '@/components/dashboard/student/topbar';
import { SupportTicketsClient } from '@/components/dashboard/student/support-tickets-client';

export default async function SupportPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <>
      <DashboardTopbar locale={locale} title="الدعم الفني" />
      <SupportTicketsClient locale={locale} />
    </>
  );
}
