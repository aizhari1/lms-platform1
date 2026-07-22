import { DashboardTopbar } from '@/components/dashboard/student/topbar';
import { SecuritySettingsClient } from '@/components/dashboard/student/security-settings-client';

export default async function SecurityPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <>
      <DashboardTopbar locale={locale} title="الأمان والخصوصية" />
      <SecuritySettingsClient />
    </>
  );
}
