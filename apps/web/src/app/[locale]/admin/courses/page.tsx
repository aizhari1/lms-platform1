import { DashboardTopbar } from '@/components/dashboard/student/topbar';
import { CourseReviewClient } from '@/components/dashboard/admin/course-review-client';

export default async function AdminCoursesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <>
      <DashboardTopbar locale={locale} title="مراجعة الكورسات" />
      <CourseReviewClient locale={locale} />
    </>
  );
}
