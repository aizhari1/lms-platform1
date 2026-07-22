import { DashboardTopbar } from '@/components/dashboard/student/topbar';
import { StudyPlannerClient } from '@/components/dashboard/student/study-planner-client';

export default async function StudyPlannerPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <>
      <DashboardTopbar locale={locale} title="التقويم والتخطيط الدراسي" />
      <StudyPlannerClient locale={locale} />
    </>
  );
}
