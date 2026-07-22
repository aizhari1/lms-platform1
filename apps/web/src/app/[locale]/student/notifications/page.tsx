import Link from 'next/link';
import { Settings } from 'lucide-react';
import { DashboardTopbar } from '@/components/dashboard/student/topbar';
import { NotificationsClient } from '@/components/dashboard/student/notifications-client';

export default async function NotificationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <>
      <DashboardTopbar locale={locale} title="الإشعارات" />
      <div className="flex justify-end px-6 pt-4">
        <Link
          href={`/${locale}/student/notifications/preferences`}
          className="flex items-center gap-1.5 text-xs font-semibold text-siraj-400 hover:underline"
        >
          <Settings size={14} /> إعدادات الإشعارات
        </Link>
      </div>
      <NotificationsClient />
    </>
  );
}
