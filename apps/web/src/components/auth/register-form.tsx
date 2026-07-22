'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AxiosError } from 'axios';
import { GraduationCap, BookOpen } from 'lucide-react';
import { registerSchema, type RegisterInput } from '@/lib/validators/auth';
import { registerRequest, persistSession } from '@/lib/api/auth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function RegisterForm({ locale }: { locale: string }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'STUDENT' },
  });

  const selectedRole = watch('role');

  async function onSubmit(values: RegisterInput) {
    setServerError(null);
    try {
      const auth = await registerRequest(values);
      persistSession(auth);
      const destination = values.role === 'TEACHER' ? 'teacher' : 'student';
      router.push(`/${locale}/${destination}/dashboard`);
    } catch (error) {
      if (error instanceof AxiosError) {
        setServerError(error.response?.data?.message ?? 'حدث خطأ أثناء إنشاء الحساب');
      } else {
        setServerError('حدث خطأ غير متوقع، حاول مرة أخرى');
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-sm space-y-5">
      {serverError && (
        <div className="rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {serverError}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setValue('role', 'STUDENT')}
          className={cn(
            'flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-semibold transition',
            selectedRole === 'STUDENT'
              ? 'border-siraj-500 bg-siraj-900/20 text-siraj-400'
              : 'border-ink-border text-muted hover:border-ink-border/80',
          )}
        >
          <GraduationCap size={22} />
          طالب
        </button>
        <button
          type="button"
          onClick={() => setValue('role', 'TEACHER')}
          className={cn(
            'flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-semibold transition',
            selectedRole === 'TEACHER'
              ? 'border-siraj-500 bg-siraj-900/20 text-siraj-400'
              : 'border-ink-border text-muted hover:border-ink-border/80',
          )}
        >
          <BookOpen size={22} />
          معلم
        </button>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-muted-light">الاسم الكامل</label>
        <Input placeholder="أحمد محمد" error={errors.fullName?.message} {...register('fullName')} />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-muted-light">البريد الإلكتروني</label>
        <Input type="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-muted-light">كلمة المرور</label>
        <Input type="password" placeholder="••••••••" error={errors.password?.message} {...register('password')} />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-muted-light">تأكيد كلمة المرور</label>
        <Input
          type="password"
          placeholder="••••••••"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
      </div>

      <Button type="submit" isLoading={isSubmitting} className="w-full">
        إنشاء الحساب
      </Button>

      <p className="text-center text-sm text-muted">
        لديك حساب بالفعل؟{' '}
        <Link href={`/${locale}/login`} className="font-semibold text-siraj-400 hover:underline">
          سجّل الدخول
        </Link>
      </p>
    </form>
  );
}
