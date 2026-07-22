import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';
import { CertificateLookupForm } from '@/components/certificates/certificate-lookup-form';

export default async function VerifyCertificateLandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <>
      <Navbar locale={locale} />
      <main className="container-page flex min-h-[70vh] items-center justify-center py-16">
        <div className="w-full max-w-lg">
          <CertificateLookupForm locale={locale} />
        </div>
      </main>
      <Footer />
    </>
  );
}
