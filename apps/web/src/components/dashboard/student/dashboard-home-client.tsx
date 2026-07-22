'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Award, TrendingUp } from 'lucide-react';
import { fetchMyEnrollments, type MyEnrollment } from '@/lib/api/student';
import { fetchContinueWatching, type ContinueWatchingItem } from '@/lib/api/progress';
import { ContinueWatchingCard } from './continue-watching-card';
import { ContinueLearningCard } from './continue-learning-card';
import { StreakWidget } from './streak-widget';
import { RecentlyViewedRow } from './recently-viewed-row';

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BookOpen;
  label: string;
  value: number | string;
}) {
  return (
    <div className="card-surface flex items-center gap-4 p-5">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-siraj-900/40 text-siraj-400">
        <Icon size={20} />
      </div>
      <div>
        <p className="font-display text-xl font-extrabold text-white">{value}</p>
        <p className="text-xs text-muted">{label}</p>
      </div>
    </div>
  );
}

export function DashboardHomeClient({ locale }: { locale: string }) {
  const [enrollments, setEnrollments] = useState<MyEnrollment[]>([]);
  const [continueWatching, setContinueWatching] = useState<ContinueWatchingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchMyEnrollments().catch(() => []),
      fetchContinueWatching().catch(() => []),
    ])
      .then(([e, cw]) => {
        setEnrollments(e);
        setContinueWatching(cw);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const inProgress = enrollments.filter((e) => !e.completedAt);
  const completed = enrollments.filter((e) => e.completedAt);
  const avgProgress =
    enrollments.length > 0
      ? enrollments.reduce((sum, e) => sum + Number(e.progressPct), 0) / enrollments.length
      : 0;

  return (
    <div className="p-6">
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={BookOpen} label="كورساتي" value={enrollments.length} />
        <StatCard icon={TrendingUp} label="متوسط التقدم" value={`${avgProgress.toFixed(0)}%`} />
        <StatCard icon={Award} label="كورسات مكتملة" value={completed.length} />
        <StreakWidget />
      </div>

      <div className="mb-8 flex items-center justify-between card-surface p-4">
        <p className="text-sm text-muted-light">تابع كل الأوسمة اللي حققتها على المنصة</p>
        <Link href={`/${locale}/student/achievements`} className="text-xs font-semibold text-siraj-400 hover:underline">
          إنجازاتي وأوسمتي
        </Link>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">استكمل التعلم</h2>
        <Link href={`/${locale}/student/watch-history`} className="text-xs font-semibold text-siraj-400 hover:underline">
          سجل المشاهدة بالكامل
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card-surface h-24 animate-pulse" />
          ))}
        </div>
      ) : continueWatching.length > 0 ? (
        <div className="space-y-3">
          {continueWatching.map((item) => (
            <ContinueWatchingCard key={item.lessonId} item={item} locale={locale} />
          ))}
        </div>
      ) : inProgress.length === 0 ? (
        <div className="card-surface p-10 text-center text-muted">
          لم تبدأ أي كورس بعد — تصفّح الكورسات المتاحة وابدأ رحلتك التعليمية
        </div>
      ) : (
        <div className="space-y-3">
          {inProgress.map((enrollment) => (
            <ContinueLearningCard key={enrollment.id} enrollment={enrollment} locale={locale} />
          ))}
        </div>
      )}

      <div className="mt-8">
        <RecentlyViewedRow locale={locale} />
      </div>
    </div>
  );
}
