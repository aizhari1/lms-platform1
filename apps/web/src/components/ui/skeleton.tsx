import { cn } from '@/lib/utils';

/**
 * Loading Skeletons — a single primitive so every list/card/page uses
 * the same shimmer instead of hand-rolled `animate-pulse` divs with
 * slightly different shades scattered across the app.
 */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-lg bg-ink-soft', className)} />;
}

export function SkeletonCard() {
  return (
    <div className="card-surface space-y-3 p-4">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="card-surface flex items-center gap-4 p-4">
      <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-1/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

export function SkeletonList({ count = 3, rows = true }: { count?: number; rows?: boolean }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) =>
        rows ? <SkeletonRow key={i} /> : <SkeletonCard key={i} />,
      )}
    </div>
  );
}
