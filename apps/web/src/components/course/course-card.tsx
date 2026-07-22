import Link from 'next/link';
import Image from 'next/image';
import { Star, Users, Clock } from 'lucide-react';
import type { CourseCardData } from '@/lib/api/courses';

function formatDuration(totalSeconds: number, locale: string): string {
  const hours = Math.floor(totalSeconds / 3600);
  return locale === 'ar' ? `${hours} ساعة` : `${hours}h`;
}

export function CourseCard({
  course,
  locale,
}: {
  course: CourseCardData;
  locale: string;
}) {
  const title = locale === 'en' && course.titleEn ? course.titleEn : course.titleAr;
  const hasDiscount = course.discountPrice && Number(course.discountPrice) < Number(course.price);

  return (
    <Link
      href={`/${locale}/courses/${course.slug}`}
      className="card-surface group flex flex-col overflow-hidden transition hover:border-siraj-700/60"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-ink-soft">
        {course.thumbnailUrl ? (
          <Image
            src={course.thumbnailUrl}
            alt={title}
            fill
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl font-display font-extrabold text-siraj-900">
            سراج
          </div>
        )}
        <span className="absolute top-3 rounded-full bg-ink/80 px-3 py-1 text-xs font-semibold text-siraj-400 backdrop-blur ltr:left-3 rtl:right-3">
          {course.category.nameAr}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="mb-2 line-clamp-2 text-base font-bold text-white">{title}</h3>
        <p className="mb-3 text-xs text-muted">{course.teacher.fullName}</p>

        <div className="mb-4 flex items-center gap-4 text-xs text-muted">
          <span className="flex items-center gap-1">
            <Star size={13} className="fill-siraj-400 text-siraj-400" />
            {Number(course.averageRating).toFixed(1)} ({course.totalReviews})
          </span>
          <span className="flex items-center gap-1">
            <Users size={13} /> {course.totalStudents}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={13} /> {formatDuration(course.totalDurationSec, locale)}
          </span>
        </div>

        <div className="mt-auto flex items-baseline gap-2">
          {hasDiscount ? (
            <>
              <span className="font-display text-lg font-extrabold text-siraj-400">
                {course.discountPrice} {course.currency}
              </span>
              <span className="text-sm text-muted line-through">
                {course.price} {course.currency}
              </span>
            </>
          ) : (
            <span className="font-display text-lg font-extrabold text-siraj-400">
              {course.price} {course.currency}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
