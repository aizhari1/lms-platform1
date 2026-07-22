'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createCourseSchema, type CreateCourseInput } from '@/lib/validators/course';
import { createCourse, fetchCategoryOptions } from '@/lib/api/teacher';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface CategoryOption {
  id: string;
  nameAr: string;
  children: { id: string; nameAr: string }[];
}

export function CreateCourseForm({ locale }: { locale: string }) {
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateCourseInput>({
    resolver: zodResolver(createCourseSchema),
    defaultValues: { level: 'ALL_LEVELS', language: 'AR', price: 0 },
  });

  useEffect(() => {
    fetchCategoryOptions().then(setCategories);
  }, []);

  async function onSubmit(values: CreateCourseInput) {
    setServerError(null);
    try {
      const course = await createCourse(values);
      router.push(`/${locale}/teacher/courses/${course.id}/lessons`);
    } catch (err: any) {
      setServerError(err?.response?.data?.message ?? 'حدث خطأ أثناء إنشاء الكورس');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card-surface max-w-2xl space-y-5 p-6">
      {serverError && (
        <div className="rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {serverError}
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-muted-light">عنوان الكورس</label>
        <Input placeholder="مثال: دورة تطوير الويب الشاملة" error={errors.titleAr?.message} {...register('titleAr')} />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-muted-light">العنوان الفرعي (اختياري)</label>
        <Input placeholder="جملة قصيرة توضح محتوى الكورس" {...register('subtitleAr')} />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-muted-light">وصف الكورس</label>
        <textarea
          {...register('descriptionAr')}
          rows={4}
          placeholder="اشرح للطلاب ما سيتعلمونه في هذا الكورس..."
          className="w-full rounded-xl border border-ink-border bg-ink-soft px-4 py-3 text-sm text-white placeholder:text-muted focus:border-siraj-500 focus:outline-none focus:ring-1 focus:ring-siraj-500"
        />
        {errors.descriptionAr && <p className="mt-1.5 text-xs text-danger">{errors.descriptionAr.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-muted-light">التصنيف</label>
          <select
            {...register('categoryId')}
            className="w-full rounded-xl border border-ink-border bg-ink-soft px-4 py-3 text-sm text-white focus:border-siraj-500 focus:outline-none"
          >
            <option value="">اختر تصنيفًا</option>
            {categories.map((cat) => (
              <optgroup key={cat.id} label={cat.nameAr}>
                <option value={cat.id}>{cat.nameAr}</option>
                {cat.children?.map((child) => (
                  <option key={child.id} value={child.id}>
                    — {child.nameAr}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          {errors.categoryId && <p className="mt-1.5 text-xs text-danger">{errors.categoryId.message}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-muted-light">المستوى</label>
          <select
            {...register('level')}
            className="w-full rounded-xl border border-ink-border bg-ink-soft px-4 py-3 text-sm text-white focus:border-siraj-500 focus:outline-none"
          >
            <option value="ALL_LEVELS">كل المستويات</option>
            <option value="BEGINNER">مبتدئ</option>
            <option value="INTERMEDIATE">متوسط</option>
            <option value="ADVANCED">متقدم</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-muted-light">السعر (ر.س)</label>
          <Input type="number" step="0.01" error={errors.price?.message} {...register('price')} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-muted-light">سعر بعد الخصم (اختياري)</label>
          <Input type="number" step="0.01" {...register('discountPrice')} />
        </div>
      </div>

      <Button type="submit" isLoading={isSubmitting} className="w-full">
        إنشاء الكورس والمتابعة لإضافة المحتوى
      </Button>
    </form>
  );
}
