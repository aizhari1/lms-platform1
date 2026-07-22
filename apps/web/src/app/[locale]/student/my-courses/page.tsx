import { DashboardTopbar } from '@/components/dashboard/student/topbar';
import { MyCoursesClient } from '@/components/dashboard/student/my-courses-client';

export default async function MyCoursesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <>
      <DashboardTopbar locale={locale} title="كورساتي" />
      <MyCoursesClient locale={locale} />
    </>
  );
}
