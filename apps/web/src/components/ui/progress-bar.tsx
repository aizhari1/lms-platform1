import { cn } from '@/lib/utils';

export function ProgressBar({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const clamped = Math.min(Math.max(value, 0), 100);

  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-ink-border', className)}>
      <div
        className="h-full rounded-full bg-siraj-500 transition-all duration-500"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
