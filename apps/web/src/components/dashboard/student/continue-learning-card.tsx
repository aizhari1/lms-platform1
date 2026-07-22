import Link from 'next/link';
import Image from 'next/image';
import { PlayCircle, History } from 'lucide-react';
import { ProgressBar } from '@/components/ui/progress-bar';
import type { MyEnrollment } from '@/lib/api/student';

export function ContinueLearningCard({
  enrollment,
  locale,
}: {
  enrollment: MyEnrollment;
  locale: string;
}) {
  const progress = Number(enrollment.progressPct);

  return (
    <div className="card-surface group relative flex items-center gap-4 p-4 transition hover:border-siraj-700/60">
      <Link href={`/${locale}/course/${enrollment.course.slug}/learn`} className="flex flex-1 items-center gap-4">
        <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-ink">
          {enrollment.course.thumbnailUrl ? (
            <Image
              src={enrollment.course.thumbnailUrl}
              alt={enrollment.course.titleAr}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-siraj-900">
              <PlayCircle size={24} />
            </div>
          )}
        </div>

        <div className="flex-1">
          <h3 className="mb-1 line-clamp-1 text-sm font-bold text-white">
            {enrollment.course.titleAr}
          </h3>
          <p className="mb-2 text-xs text-muted">{enrollment.course.teacher.fullName}</p>
          <ProgressBar value={progress} />
          <p className="mt-1 text-xs text-siraj-400">{progress.toFixed(0)}% مكتمل</p>
        </div>
      </Link>

      <Link
        href={`/${locale}/student/my-courses/${enrollment.course.id}/timeline`}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink-soft text-muted hover:text-siraj-400"
        aria-label="الجدول الزمني للإتمام"
        title="الجدول الزمني للإتمام"
      >
        <History size={16} />
      </Link>
    </div>
  );
}
