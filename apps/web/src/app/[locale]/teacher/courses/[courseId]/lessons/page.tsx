import { DashboardTopbar } from '@/components/dashboard/student/topbar';
import { CourseContentManager } from '@/components/dashboard/teacher/course-content-manager';

export default async function CourseLessonsPage({
  params,
}: {
  params: Promise<{ locale: string; courseId: string }>;
}) {
  const { locale, courseId } = await params;

  return (
    <>
      <DashboardTopbar locale={locale} title="إدارة محتوى الكورس" />
      <div className="p-6">
        <CourseContentManager courseId={courseId} />
      </div>
    </>
  );
}
