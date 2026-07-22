import { DashboardTopbar } from '@/components/dashboard/student/topbar';
import { OrdersClient } from '@/components/dashboard/student/orders-client';

export default async function OrdersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <>
      <DashboardTopbar locale={locale} title="فواتيري وطلباتي" />
      <OrdersClient />
    </>
  );
}
