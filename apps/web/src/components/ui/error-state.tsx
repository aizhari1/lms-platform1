import { AlertTriangle, RotateCw } from 'lucide-react';
import { Button } from './button';

/**
 * Error States — a consistent "something went wrong, try again" block,
 * used when a fetch fails, instead of pages silently showing nothing
 * or an empty state that looks identical to "no data" (which is
 * misleading — network failure and zero results are different states).
 */
export function ErrorState({
  message = 'حصل خطأ أثناء تحميل البيانات',
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="card-surface flex flex-col items-center gap-3 p-12 text-center">
      <AlertTriangle size={36} className="text-danger" />
      <p className="text-muted">{message}</p>
      {onRetry && (
        <Button size="sm" variant="outline" onClick={onRetry}>
          <RotateCw size={13} className="ml-1.5" /> إعادة المحاولة
        </Button>
      )}
    </div>
  );
}
