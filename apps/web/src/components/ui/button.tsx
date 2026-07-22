import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-xl font-display font-bold transition disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siraj-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ink',
  {
    variants: {
      variant: {
        primary: 'bg-siraj-500 text-white hover:bg-siraj-400',
        outline: 'border border-ink-border text-white hover:border-siraj-500 hover:text-siraj-400',
        ghost: 'text-muted-light hover:text-white hover:bg-ink-card',
        danger: 'bg-danger text-white hover:bg-danger/90',
      },
      size: {
        sm: 'px-4 py-2 text-xs',
        md: 'px-6 py-3 text-sm',
        lg: 'px-8 py-4 text-base',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 size={16} className="animate-spin" />}
        {children}
      </button>
    );
  },
);
Button.displayName = 'Button';
