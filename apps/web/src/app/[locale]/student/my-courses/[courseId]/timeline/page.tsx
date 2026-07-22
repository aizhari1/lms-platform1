import { DashboardTopbar } from '@/components/dashboard/student/topbar';
import { CompletionTimelineClient } from '@/components/dashboard/student/completion-timeline-client';

export default async function CourseTimelinePage({
  params,
}: {
  params: Promise<{ locale: string; courseId: string }>;
}) {
  const { locale, courseId } = await params;

  return (
    <>
      <DashboardTopbar locale={locale} title="الجدول الزمني للإتمام" />
      <CompletionTimelineClient courseId={courseId} />
    </>
  );
}
