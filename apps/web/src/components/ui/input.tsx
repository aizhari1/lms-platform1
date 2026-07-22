import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          ref={ref}
          className={cn(
            'w-full rounded-xl border border-ink-border bg-ink-soft px-4 py-3 text-sm text-white placeholder:text-muted focus:border-siraj-500 focus:outline-none focus:ring-1 focus:ring-siraj-500',
            error && 'border-danger focus:border-danger focus:ring-danger',
            className,
          )}
          {...props}
        />
        {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
      </div>
    );
  },
);
Input.displayName = 'Input';
