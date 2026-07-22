'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AxiosError } from 'axios';
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/lib/validators/auth';
import { forgotPasswordRequest } from '@/lib/api/auth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function ForgotPasswordForm({ locale }: { locale: string }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });

  async function onSubmit(values: ForgotPasswordInput) {
    setServerError(null);
    try {
      await forgotPasswordRequest(values.email);
      setSent(true);
    } catch (error) {
      if (error instanceof AxiosError) {
        setServerError(error.response?.data?.message ?? 'حدث خطأ أثناء إرسال الطلب');
      } else {
        setServerError('حدث خطأ غير متوقع، حاول مرة أخرى');
      }
    }
  }

  if (sent) {
    return (
      <div className="w-full max-w-sm space-y-4 text-center">
        <p className="text-sm text-muted-light">
          إذا كان هذا البريد مسجّلاً لدينا، فستصلك رسالة تحتوي على رابط إعادة تعيين كلمة المرور خلال دقائق.
        </p>
        <Link href={`/${locale}/login`} className="font-semibold text-siraj-400 hover:underline">
          العودة لتسجيل الدخول
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-sm space-y-5">
      {serverError && (
        <div className="rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {serverError}
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-muted-light">
          البريد الإلكتروني
        </label>
        <Input
          type="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email')}
        />
      </div>

      <Button type="submit" isLoading={isSubmitting} className="w-full">
        إرسال رابط إعادة التعيين
      </Button>

      <p className="text-center text-sm text-muted">
        تذكّرت كلمة المرور؟{' '}
        <Link href={`/${locale}/login`} className="font-semibold text-siraj-400 hover:underline">
          سجّل الدخول
        </Link>
      </p>
    </form>
  );
}
