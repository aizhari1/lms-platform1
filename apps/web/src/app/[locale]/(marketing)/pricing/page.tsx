import { Navbar } from '@/components/landing/navbar';
import { Pricing } from '@/components/landing/pricing';
import { Footer } from '@/components/landing/footer';

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <>
      <Navbar locale={locale} />
      <main>
        <Pricing locale={locale} />
      </main>
      <Footer />
    </>
  );
}
