import { DashboardTopbar } from '@/components/dashboard/student/topbar';
import { TicketDetailClient } from '@/components/dashboard/student/ticket-detail-client';

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ locale: string; ticketId: string }>;
}) {
  const { locale, ticketId } = await params;

  return (
    <>
      <DashboardTopbar locale={locale} title="تفاصيل التذكرة" />
      <TicketDetailClient ticketId={ticketId} />
    </>
  );
}
