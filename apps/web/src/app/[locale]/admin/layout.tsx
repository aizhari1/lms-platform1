import { AdminSidebar } from '@/components/dashboard/admin/sidebar';

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <div className="flex">
      <AdminSidebar locale={locale} />
      <div className="min-h-screen flex-1 bg-ink">{children}</div>
    </div>
  );
}
