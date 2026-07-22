import { DashboardTopbar } from '@/components/dashboard/student/topbar';
import { NotesBookmarksClient } from '@/components/dashboard/student/notes-bookmarks-client';

export default async function NotesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <>
      <DashboardTopbar locale={locale} title="ملاحظاتي والعلامات المرجعية" />
      <NotesBookmarksClient locale={locale} />
    </>
  );
}
