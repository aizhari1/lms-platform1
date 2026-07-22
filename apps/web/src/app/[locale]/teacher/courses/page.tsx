import { DashboardTopbar } from '@/components/dashboard/student/topbar';
import { TeacherCoursesClient } from '@/components/dashboard/teacher/courses-client';

export default async function TeacherCoursesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <>
      <DashboardTopbar locale={locale} title="كورساتي" />
      <TeacherCoursesClient locale={locale} />
    </>
  );
}
