'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PlusCircle, Users, Star } from 'lucide-react';
import { fetchMyTeachingCourses, submitCourseForReview } from '@/lib/api/teacher';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  DRAFT: { label: 'مسودة', className: 'bg-muted/20 text-muted' },
  PENDING_REVIEW: { label: 'قيد المراجعة', className: 'bg-siraj-900/40 text-siraj-400' },
  PUBLISHED: { label: 'منشور', className: 'bg-success/20 text-success' },
  REJECTED: { label: 'مرفوض', className: 'bg-danger/20 text-danger' },
  ARCHIVED: { label: 'مؤرشف', className: 'bg-muted/20 text-muted' },
};

export function TeacherCoursesClient({ locale }: { locale: string }) {
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  useEffect(() => {
    fetchMyTeachingCourses()
      .then(setCourses)
      .finally(() => setIsLoading(false));
  }, []);

  async function handleSubmitForReview(courseId: string) {
    setSubmittingId(courseId);
    try {
      await submitCourseForReview(courseId);
      setCourses((prev) =>
        prev.map((c) => (c.id === courseId ? { ...c, status: 'PENDING_REVIEW' } : c)),
      );
    } finally {
      setSubmittingId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card-surface h-64 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-end">
        <Link href={`/${locale}/teacher/courses/create`}>
          <Button>
            <PlusCircle size={16} /> كورس جديد
          </Button>
        </Link>
      </div>

      {courses.length === 0 ? (
        <div className="card-surface p-12 text-center text-muted">
          لسه معملت أي كورس — ابدأ بإنشاء أول كورس ليك
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => {
            const status = STATUS_LABELS[course.status] ?? STATUS_LABELS.DRAFT;
            return (
              <div key={course.id} className="card-surface overflow-hidden">
                <div className="relative aspect-video bg-ink-soft">
                  {course.thumbnailUrl ? (
                    <Image src={course.thumbnailUrl} alt={course.titleAr} fill className="object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-siraj-900">سراج</div>
                  )}
                  <span
                    className={cn(
                      'absolute top-3 rounded-full px-3 py-1 text-xs font-semibold ltr:left-3 rtl:right-3',
                      status.className,
                    )}
                  >
                    {status.label}
                  </span>
                </div>

                <div className="p-4">
                  <h3 className="mb-2 line-clamp-2 text-sm font-bold text-white">{course.titleAr}</h3>

                  <div className="mb-4 flex items-center gap-4 text-xs text-muted">
                    <span className="flex items-center gap-1">
                      <Users size={12} /> {course.totalStudents}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star size={12} className="fill-siraj-400 text-siraj-400" />
                      {Number(course.averageRating).toFixed(1)}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/${locale}/teacher/courses/${course.id}/lessons`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        إدارة المحتوى
                      </Button>
                    </Link>
                    <Link href={`/${locale}/teacher/courses/${course.id}/students`}>
                      <Button variant="ghost" size="sm">
                        <Users size={14} />
                      </Button>
                    </Link>
                    {course.status === 'DRAFT' && (
                      <Button
                        size="sm"
                        isLoading={submittingId === course.id}
                        onClick={() => handleSubmitForReview(course.id)}
                      >
                        تقديم للمراجعة
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
