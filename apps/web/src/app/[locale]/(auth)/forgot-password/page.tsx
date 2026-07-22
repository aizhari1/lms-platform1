import Link from 'next/link';
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';

export default async function ForgotPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-lamp-glow-soft" />

      <div className="relative w-full max-w-sm">
        <Link href={`/${locale}`} className="mb-10 flex justify-center">
          <span className="font-display text-2xl font-extrabold text-siraj-500">سراج</span>
        </Link>

        <div className="card-surface p-8">
          <h1 className="mb-1 text-center text-xl font-bold text-white">
            نسيت كلمة المرور؟
          </h1>
          <p className="mb-6 text-center text-sm text-muted">
            أدخل بريدك الإلكتروني وسنرسل لك رابطًا لإعادة تعيينها
          </p>

          <div className="flex justify-center">
            <ForgotPasswordForm locale={locale} />
          </div>
        </div>
      </div>
    </div>
  );
}
