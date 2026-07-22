'use client';

import { useEffect, useState } from 'react';
import { Award, Flame, Footprints, Star, Trophy, Lock } from 'lucide-react';
import { fetchMyBadges, fetchMyStreak, type BadgeItem, type StreakInfo } from '@/lib/api/achievements';

const ICONS: Record<string, typeof Award> = {
  award: Award,
  flame: Flame,
  footprints: Footprints,
  star: Star,
  trophy: Trophy,
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function AchievementsClient() {
  const [badges, setBadges] = useState<BadgeItem[]>([]);
  const [streak, setStreak] = useState<StreakInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchMyBadges().catch(() => []), fetchMyStreak().catch(() => null)])
      .then(([b, s]) => {
        setBadges(b);
        setStreak(s);
      })
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 p-6 sm:grid-cols-3 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card-surface h-40 animate-pulse" />
        ))}
      </div>
    );
  }

  const earnedCount = badges.filter((b) => b.isEarned).length;

  return (
    <div className="p-6">
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card-surface flex items-center gap-4 p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
            <Flame size={22} />
          </div>
          <div>
            <p className="font-display text-xl font-extrabold text-white">
              {streak?.currentStreak ?? 0}
            </p>
            <p className="text-xs text-muted">أيام سلسلة التعلم الحالية</p>
          </div>
        </div>
        <div className="card-surface flex items-center gap-4 p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-siraj-900/40 text-siraj-400">
            <Trophy size={22} />
          </div>
          <div>
            <p className="font-display text-xl font-extrabold text-white">
              {streak?.longestStreak ?? 0}
            </p>
            <p className="text-xs text-muted">أطول سلسلة تعلم</p>
          </div>
        </div>
        <div className="card-surface flex items-center gap-4 p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-siraj-900/40 text-siraj-400">
            <Award size={22} />
          </div>
          <div>
            <p className="font-display text-xl font-extrabold text-white">
              {earnedCount} / {badges.length}
            </p>
            <p className="text-xs text-muted">أوسمة محققة</p>
          </div>
        </div>
      </div>

      <h2 className="mb-4 text-lg font-bold text-white">الأوسمة</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {badges.map((badge) => {
          const Icon = ICONS[badge.icon] ?? Award;
          return (
            <div
              key={badge.id}
              className={`card-surface flex flex-col items-center gap-3 p-6 text-center ${
                badge.isEarned ? '' : 'opacity-50'
              }`}
            >
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-full ${
                  badge.isEarned ? 'bg-siraj-500 text-white' : 'bg-ink-soft text-muted'
                }`}
              >
                {badge.isEarned ? <Icon size={26} /> : <Lock size={22} />}
              </div>
              <div>
                <p className="text-sm font-bold text-white">{badge.titleAr}</p>
                <p className="mt-1 text-xs text-muted">{badge.descriptionAr}</p>
                {badge.isEarned && badge.earnedAt && (
                  <p className="mt-2 text-[11px] text-siraj-400">
                    تحققت في {formatDate(badge.earnedAt)}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
