import type { Metadata } from 'next';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';

export const metadata: Metadata = {
  title: 'من نحن',
};

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isAr = locale === 'ar';

  return (
    <>
      <Navbar locale={locale} />
      <main className="container-page py-20">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold text-siraj-400">
            {isAr ? 'من نحن' : 'About us'}
          </span>
          <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">
            {isAr ? 'سراج — منصة تعليمية عربية متكاملة' : 'SIRAJ — a complete Arabic learning platform'}
          </h1>
          <p className="mt-6 leading-relaxed text-muted-light">
            {isAr
              ? 'نؤمن بأن التعليم الجيد يجب أن يكون بلغتنا، بجودة عالمية، وفي متناول الجميع. سراج تجمع بين أفضل المدرّسين وأحدث الأدوات التعليمية لتقديم تجربة تعلّم حقيقية تتابع تقدّمك وتمنحك شهادات معتمدة.'
              : 'We believe great education should speak our language, meet a world-class bar, and be within everyone\u2019s reach. SIRAJ brings together top instructors and modern learning tools to deliver a real learning experience — one that tracks your progress and rewards it with certified credentials.'}
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
