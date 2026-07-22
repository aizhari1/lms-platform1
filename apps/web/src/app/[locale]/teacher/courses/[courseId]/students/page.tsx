import { DashboardTopbar } from '@/components/dashboard/student/topbar';
import { CourseStudentsClient } from '@/components/dashboard/teacher/course-students-client';

export default async function CourseStudentsPage({
  params,
}: {
  params: Promise<{ locale: string; courseId: string }>;
}) {
  const { locale, courseId } = await params;

  return (
    <>
      <DashboardTopbar locale={locale} title="طلاب الكورس" />
      <CourseStudentsClient courseId={courseId} />
    </>
  );
}
