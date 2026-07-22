'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ExamTimer({
  startedAt,
  durationMin,
  onExpire,
}: {
  startedAt: string;
  durationMin: number;
  onExpire: () => void;
}) {
  const [remainingSec, setRemainingSec] = useState(() => calculateRemaining(startedAt, durationMin));

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = calculateRemaining(startedAt, durationMin);
      setRemainingSec(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        onExpire();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startedAt, durationMin, onExpire]);

  const minutes = Math.floor(remainingSec / 60);
  const seconds = remainingSec % 60;
  const isCritical = remainingSec <= 60;

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-xl border px-4 py-2 font-display text-lg font-bold',
        isCritical
          ? 'animate-pulse border-danger/50 bg-danger/10 text-danger'
          : 'border-siraj-700/50 bg-siraj-900/20 text-siraj-400',
      )}
    >
      <Clock size={18} />
      {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
    </div>
  );
}

function calculateRemaining(startedAt: string, durationMin: number): number {
  const deadline = new Date(startedAt).getTime() + durationMin * 60_000;
  const remaining = Math.floor((deadline - Date.now()) / 1000);
  return Math.max(remaining, 0);
}
