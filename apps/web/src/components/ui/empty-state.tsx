import type { LucideIcon } from 'lucide-react';
import { Button } from './button';

/**
 * Empty States — one consistent shape (icon, message, optional action)
 * instead of each page hand-rolling its own "nothing here yet" block.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="card-surface flex flex-col items-center gap-3 p-12 text-center">
      <Icon size={40} className="text-siraj-500" />
      <div>
        <p className="font-semibold text-white">{title}</p>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {actionLabel && onAction && (
        <Button size="sm" onClick={onAction} className="mt-2">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
