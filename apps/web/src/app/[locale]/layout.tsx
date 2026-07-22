import type { Metadata } from 'next';
import { Cairo, Tajawal, Inter } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Toaster } from 'sonner';
import { locales, localeDirection, type Locale } from '@/i18n/config';
import { ConfirmDialogProvider } from '@/components/ui/confirm-dialog';
import '../globals.css';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-cairo',
  display: 'swap',
});

const tajawal = Tajawal({
  subsets: ['arabic', 'latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-tajawal',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'سراج | منصة تعليمية متكاملة',
    template: '%s | سراج',
  },
  description: 'منصة سراج التعليمية — كورسات عربية، متابعة تقدم حقيقية، وشهادات معتمدة.',
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const messages = await getMessages();
  const dir = localeDirection[locale as Locale];

  return (
    <html lang={locale} dir={dir} className={`${cairo.variable} ${tajawal.variable} ${inter.variable}`}>
      <body className="bg-ink min-h-screen">
        {/* Accessibility: lets keyboard/screen-reader users jump past the
            nav on every page instead of tabbing through it every time. */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-siraj-500 focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white focus:ltr:left-4 focus:rtl:right-4"
        >
          {dir === 'rtl' ? 'تخطَّ إلى المحتوى الرئيسي' : 'Skip to main content'}
        </a>
        <NextIntlClientProvider messages={messages}>
          <ConfirmDialogProvider>{children}</ConfirmDialogProvider>
          <Toaster
            position={dir === 'rtl' ? 'top-left' : 'top-right'}
            dir={dir}
            theme="dark"
            richColors
            closeButton
          />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
