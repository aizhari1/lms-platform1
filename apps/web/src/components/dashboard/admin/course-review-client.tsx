'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CheckCircle2, XCircle, ExternalLink } from 'lucide-react';
import { fetchPendingCourses, approveCourse, rejectCourse } from '@/lib/api/admin';
import { Button } from '@/components/ui/button';

export function CourseReviewClient({ locale }: { locale: string }) {
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  useEffect(() => {
    refresh();
  }, []);

  function refresh() {
    fetchPendingCourses()
      .then(setCourses)
      .finally(() => setIsLoading(false));
  }

  async function handleApprove(courseId: string) {
    setActingId(courseId);
    try {
      await approveCourse(courseId);
      setCourses((prev) => prev.filter((c) => c.id !== courseId));
    } finally {
      setActingId(null);
    }
  }

  async function handleReject(courseId: string) {
    setActingId(courseId);
    try {
      await rejectCourse(courseId);
      setCourses((prev) => prev.filter((c) => c.id !== courseId));
    } finally {
      setActingId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3 p-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card-surface h-28 animate-pulse" />
        ))}
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="p-6">
        <div className="card-surface p-12 text-center text-muted">
          لا توجد كورسات في انتظار المراجعة حاليًا 🎉
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6">
      {courses.map((course) => (
        <div key={course.id} className="card-surface flex items-center gap-4 p-4">
          <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-ink-soft">
            {course.thumbnailUrl && (
              <Image src={course.thumbnailUrl} alt={course.titleAr} fill className="object-cover" />
            )}
          </div>

          <div className="flex-1">
            <h3 className="text-sm font-bold text-white">{course.titleAr}</h3>
            <p className="text-xs text-muted">
              المعلم: {course.teacher.fullName} — {course.category.nameAr}
            </p>
          </div>

          <Link
            href={`/${locale}/courses/${course.slug}`}
            target="_blank"
            className="flex items-center gap-1 text-xs text-siraj-400 hover:underline"
          >
            معاينة <ExternalLink size={12} />
          </Link>

          <Button
            size="sm"
            variant="outline"
            isLoading={actingId === course.id}
            onClick={() => handleReject(course.id)}
            className="!border-danger/40 !text-danger hover:!border-danger"
          >
            <XCircle size={15} /> رفض
          </Button>
          <Button size="sm" isLoading={actingId === course.id} onClick={() => handleApprove(course.id)}>
            <CheckCircle2 size={15} /> موافقة
          </Button>
        </div>
      ))}
    </div>
  );
}
