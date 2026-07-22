import { DashboardTopbar } from '@/components/dashboard/student/topbar';
import { CertificatesClient } from '@/components/dashboard/student/certificates-client';

export default async function CertificatesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <>
      <DashboardTopbar locale={locale} title="شهاداتي" />
      <CertificatesClient />
    </>
  );
}
