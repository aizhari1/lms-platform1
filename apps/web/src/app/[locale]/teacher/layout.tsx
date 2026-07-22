import { TeacherSidebar } from '@/components/dashboard/teacher/sidebar';

export default async function TeacherLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <div className="flex">
      <TeacherSidebar locale={locale} />
      <div className="min-h-screen flex-1 bg-ink">{children}</div>
    </div>
  );
}
