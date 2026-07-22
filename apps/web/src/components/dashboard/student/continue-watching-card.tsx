import Link from 'next/link';
import Image from 'next/image';
import { PlayCircle } from 'lucide-react';
import { ProgressBar } from '@/components/ui/progress-bar';
import type { ContinueWatchingItem } from '@/lib/api/progress';

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return `${minutes} د`;
}

export function ContinueWatchingCard({
  item,
  locale,
}: {
  item: ContinueWatchingItem;
  locale: string;
}) {
  const pct = item.videoDurationSec
    ? Math.min(100, (item.lastPositionSec / item.videoDurationSec) * 100)
    : 0;

  return (
    <Link
      href={`/${locale}/course/${item.course.slug}/learn/${item.lesson.id}`}
      className="card-surface group flex items-center gap-4 p-4 transition hover:border-siraj-700/60"
    >
      <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-ink">
        {item.course.thumbnailUrl ? (
          <Image
            src={item.course.thumbnailUrl}
            alt={item.course.titleAr}
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
        <p className="mb-0.5 text-xs text-muted">{item.course.titleAr}</p>
        <h3 className="mb-1 line-clamp-1 text-sm font-bold text-white">{item.lesson.titleAr}</h3>
        <ProgressBar value={pct} />
        {item.videoDurationSec ? (
          <p className="mt-1 text-xs text-siraj-400">
            {formatDuration(item.lastPositionSec)} من {formatDuration(item.videoDurationSec)}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
