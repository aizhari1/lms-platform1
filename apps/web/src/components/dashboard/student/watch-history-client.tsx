'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, PlayCircle, History } from 'lucide-react';
import { fetchWatchHistory, type WatchHistoryItem } from '@/lib/api/progress';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ar-EG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return `${minutes} دقيقة`;
}

export function WatchHistoryClient({ locale }: { locale: string }) {
  const [items, setItems] = useState<WatchHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchWatchHistory()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-3 p-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card-surface h-20 animate-pulse" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="p-6">
        <div className="card-surface flex flex-col items-center gap-3 p-12 text-center">
          <History size={40} className="text-siraj-500" />
          <p className="text-muted">لسه معندكش سجل مشاهدة — ابدأ أي درس وهيتسجل هنا تلقائيًا</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-6">
      {items.map((item) => (
        <Link
          key={item.lessonId}
          href={`/${locale}/course/${item.course.slug}/learn/${item.lesson.id}`}
          className="card-surface flex items-center gap-4 p-4 transition hover:border-siraj-700/60"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-siraj-900/40 text-siraj-400">
            {item.isCompleted ? <CheckCircle2 size={18} /> : <PlayCircle size={18} />}
          </div>

          <div className="flex-1">
            <p className="mb-0.5 text-xs text-muted">{item.course.titleAr}</p>
            <h3 className="text-sm font-bold text-white">{item.lesson.titleAr}</h3>
          </div>

          <div className="text-end">
            <p className="text-xs font-semibold text-siraj-400">
              {item.isCompleted ? 'مكتمل' : `شاهدت ${formatDuration(item.watchedSeconds)}`}
            </p>
            <p className="text-[11px] text-muted">{formatDate(item.updatedAt)}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
