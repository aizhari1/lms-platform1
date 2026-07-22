import { Navbar } from '@/components/landing/navbar';
import { Hero } from '@/components/landing/hero';
import { Marquee } from '@/components/landing/marquee';
import { AboutTeaser } from '@/components/landing/about-teaser';
import { Stages } from '@/components/landing/stages';
import { Achievers } from '@/components/landing/achievers';
import { Features } from '@/components/landing/features';
import { Pricing } from '@/components/landing/pricing';
import { VideoShowcase } from '@/components/landing/video-showcase';
import { Footer } from '@/components/landing/footer';

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <>
      <Navbar locale={locale} />
      <main>
        <Hero locale={locale} />
        <Marquee />
        <AboutTeaser />
        <Stages />
        <Achievers />
        <Features />
        <Pricing locale={locale} />
        <VideoShowcase />
      </main>
      <Footer />
    </>
  );
}
