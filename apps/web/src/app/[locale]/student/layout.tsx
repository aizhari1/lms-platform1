import { StudentSidebar } from '@/components/dashboard/student/sidebar';

export default async function StudentLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <div className="flex">
      <StudentSidebar locale={locale} />
      <div id="main-content" className="min-h-screen flex-1 bg-ink">{children}</div>
    </div>
  );
}
