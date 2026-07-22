'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { fetchMyEnrollments, type MyEnrollment } from '@/lib/api/student';
import { ContinueLearningCard } from './continue-learning-card';
import { cn } from '@/lib/utils';

type FilterTab = 'all' | 'in-progress' | 'completed';

export function MyCoursesClient({ locale }: { locale: string }) {
  const [enrollments, setEnrollments] = useState<MyEnrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState<FilterTab>('all');

  useEffect(() => {
    fetchMyEnrollments()
      .then(setEnrollments)
      .catch(() => setEnrollments([]))
      .finally(() => setIsLoading(false));
  }, []);

  const filtered = enrollments.filter((e) => {
    if (tab === 'in-progress') return !e.completedAt;
    if (tab === 'completed') return !!e.completedAt;
    return true;
  });

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'الكل' },
    { key: 'in-progress', label: 'جارية' },
    { key: 'completed', label: 'مكتملة' },
  ];

  return (
    <div className="p-6">
      <div className="mb-6 flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'rounded-xl px-4 py-2 text-sm font-semibold transition',
              tab === t.key
                ? 'bg-siraj-500 text-white'
                : 'bg-ink-card text-muted-light hover:text-white',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card-surface h-24 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card-surface p-10 text-center text-muted">
          لا توجد كورسات في هذا القسم حاليًا
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filtered.map((enrollment) => (
            <ContinueLearningCard key={enrollment.id} enrollment={enrollment} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}
