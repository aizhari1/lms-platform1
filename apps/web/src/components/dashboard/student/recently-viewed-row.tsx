'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star, PlayCircle } from 'lucide-react';
import { fetchRecentlyViewed, type RecentlyViewedItem } from '@/lib/api/recently-viewed';

export function RecentlyViewedRow({ locale }: { locale: string }) {
  const [items, setItems] = useState<RecentlyViewedItem[]>([]);

  useEffect(() => {
    fetchRecentlyViewed()
      .then(setItems)
      .catch(() => setItems([]));
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="mb-4 text-lg font-bold text-white">شاهدتها مؤخرًا</h2>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {items.map(({ course }) => (
          <Link
            key={course.id}
            href={`/${locale}/courses/${course.slug}`}
            className="card-surface w-48 shrink-0 overflow-hidden transition hover:border-siraj-700/60"
          >
            <div className="relative h-24 w-full bg-ink">
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
              <div className="mt-1 flex items-center gap-1 text-[11px] text-amber-400">
                <Star size={11} fill="currentColor" /> {Number(course.averageRating).toFixed(1)}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
