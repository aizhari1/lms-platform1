'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star, PlayCircle } from 'lucide-react';
import { fetchRelatedCourses, type RelatedCourse } from '@/lib/api/course-extras';

export function RelatedCoursesSection({ courseId, locale }: { courseId: string; locale: string }) {
  const [courses, setCourses] = useState<RelatedCourse[]>([]);

  useEffect(() => {
    fetchRelatedCourses(courseId)
      .then(setCourses)
      .catch(() => setCourses([]));
  }, [courseId]);

  if (courses.length === 0) return null;

  return (
    <section className="container-page border-t border-ink-border py-12">
      <h2 className="mb-6 text-xl font-bold text-white">كورسات ذات صلة</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {courses.map((course) => (
          <Link
            key={course.id}
            href={`/${locale}/courses/${course.slug}`}
            className="card-surface overflow-hidden transition hover:border-siraj-700/60"
          >
            <div className="relative aspect-video w-full bg-ink">
              {course.thumbnailUrl ? (
                <Image src={course.thumbnailUrl} alt={course.titleAr} fill className="object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-siraj-900">
                  <PlayCircle size={24} />
                </div>
              )}
            </div>
            <div className="p-3">
              <p className="line-clamp-2 text-xs font-bold text-white">{course.titleAr}</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="flex items-center gap-1 text-[11px] text-amber-400">
                  <Star size={11} fill="currentColor" /> {Number(course.averageRating).toFixed(1)}
                </span>
                <span className="text-xs font-bold text-siraj-400">
                  {course.discountPrice ?? course.price} {course.currency}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
