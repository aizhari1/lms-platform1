import { DashboardTopbar } from '@/components/dashboard/student/topbar';
import { ProfileClient } from '@/components/dashboard/student/profile-client';

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <>
      <DashboardTopbar locale={locale} title="حسابي" />
      <ProfileClient />
    </>
  );
}
