'use client';

import { useEffect, useState } from 'react';
import { Flame } from 'lucide-react';
import { fetchMyStreak, type StreakInfo } from '@/lib/api/achievements';

export function StreakWidget() {
  const [streak, setStreak] = useState<StreakInfo | null>(null);

  useEffect(() => {
    fetchMyStreak()
      .then(setStreak)
      .catch(() => setStreak(null));
  }, []);

  if (!streak || streak.currentStreak === 0) return null;

  return (
    <div className="card-surface flex items-center gap-4 p-5">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
        <Flame size={22} />
      </div>
      <div>
        <p className="font-display text-xl font-extrabold text-white">
          {streak.currentStreak} {streak.currentStreak === 1 ? 'يوم' : 'أيام'}
        </p>
        <p className="text-xs text-muted">
          سلسلة التعلم {streak.isActiveToday ? '— استمر النهاردة! 🔥' : ''}
        </p>
      </div>
    </div>
  );
}
