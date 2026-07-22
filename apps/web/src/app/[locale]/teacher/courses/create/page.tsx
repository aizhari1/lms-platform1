import { DashboardTopbar } from '@/components/dashboard/student/topbar';
import { CreateCourseForm } from '@/components/dashboard/teacher/create-course-form';

export default async function CreateCoursePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <>
      <DashboardTopbar locale={locale} title="إنشاء كورس جديد" />
      <div className="p-6">
        <CreateCourseForm locale={locale} />
      </div>
    </>
  );
}
