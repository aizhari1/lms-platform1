import { DashboardTopbar } from '@/components/dashboard/student/topbar';
import { AchievementsClient } from '@/components/dashboard/student/achievements-client';

export default async function AchievementsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <>
      <DashboardTopbar locale={locale} title="إنجازاتي وأوسمتي" />
      <AchievementsClient />
    </>
  );
}
