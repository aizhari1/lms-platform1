'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AxiosError } from 'axios';
import { loginSchema, type LoginInput } from '@/lib/validators/auth';
import { loginRequest, verify2faLoginRequest, persistSession } from '@/lib/api/auth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function LoginForm({ locale }: { locale: string }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  function goToDashboard(role: string) {
    const destination = role === 'ADMIN' ? 'admin' : role === 'TEACHER' ? 'teacher' : 'student';
    router.push(`/${locale}/${destination}/dashboard`);
  }

  async function onSubmit(values: LoginInput) {
    setServerError(null);
    try {
      const result = await loginRequest(values.email, values.password);

      if ('requires2fa' in result) {
        setChallengeToken(result.challengeToken);
        return;
      }

      persistSession(result);
      goToDashboard(result.user.role);
    } catch (error) {
      if (error instanceof AxiosError) {
        setServerError(
          error.response?.data?.message ?? 'حدث خطأ أثناء تسجيل الدخول',
        );
      } else {
        setServerError('حدث خطأ غير متوقع، حاول مرة أخرى');
      }
    }
  }

  async function handleVerify2fa() {
    if (!challengeToken || !twoFactorCode) return;
    setServerError(null);
    setIsVerifying(true);
    try {
      const auth = await verify2faLoginRequest(challengeToken, twoFactorCode);
      persistSession(auth);
      goToDashboard(auth.user.role);
    } catch {
      setServerError('كود التحقق غلط، جرب تاني');
    } finally {
      setIsVerifying(false);
    }
  }

  if (challengeToken) {
    return (
      <div className="w-full max-w-sm space-y-5">
        {serverError && (
          <div className="rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
            {serverError}
          </div>
        )}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-muted-light">
            كود التحقق بخطوتين
          </label>
          <Input
            value={twoFactorCode}
            onChange={(e) => setTwoFactorCode(e.target.value)}
            placeholder="123456"
          />
          <p className="mt-2 text-xs text-muted">افتح تطبيق المصادقة وأدخل الكود المعروض</p>
        </div>
        <Button className="w-full" isLoading={isVerifying} onClick={handleVerify2fa}>
          تأكيد
        </Button>
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

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-muted-light">
          كلمة المرور
        </label>
        <Input
          type="password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password')}
        />
        <Link
          href={`/${locale}/forgot-password`}
          className="mt-2 inline-block text-xs text-siraj-400 hover:underline"
        >
          نسيت كلمة المرور؟
        </Link>
      </div>

      <Button type="submit" isLoading={isSubmitting} className="w-full">
        تسجيل الدخول
      </Button>

      <p className="text-center text-sm text-muted">
        ليس لديك حساب؟{' '}
        <Link href={`/${locale}/register`} className="font-semibold text-siraj-400 hover:underline">
          أنشئ حسابًا جديدًا
        </Link>
      </p>
    </form>
  );
}
