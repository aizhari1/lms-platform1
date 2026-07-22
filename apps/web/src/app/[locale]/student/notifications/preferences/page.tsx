import { DashboardTopbar } from '@/components/dashboard/student/topbar';
import { NotificationPreferencesClient } from '@/components/dashboard/student/notification-preferences-client';

export default async function NotificationPreferencesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <>
      <DashboardTopbar locale={locale} title="إعدادات الإشعارات" />
      <NotificationPreferencesClient />
    </>
  );
}
