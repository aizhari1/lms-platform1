'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './button';

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDangerous?: boolean;
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

/**
 * Confirmation Dialogs — mount <ConfirmDialogProvider> once near the
 * app root, then call `const { confirm } = useConfirm()` anywhere and
 * `await confirm({ title: '...' })` instead of the browser's native
 * `window.confirm()` (which can't be styled and blocks the JS thread).
 */
export function ConfirmDialogProvider({ children }: { children: React.ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolver, setResolver] = useState<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts);
    return new Promise<boolean>((resolve) => {
      setResolver(() => resolve);
    });
  }, []);

  function handleClose(result: boolean) {
    resolver?.(result);
    setOptions(null);
    setResolver(null);
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      {options && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
          onClick={() => handleClose(false)}
        >
          <div
            className="card-surface w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
          >
            <div className="mb-4 flex items-center gap-3">
              {options.isDangerous && (
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-danger/10 text-danger">
                  <AlertTriangle size={18} />
                </span>
              )}
              <h3 id="confirm-dialog-title" className="text-sm font-bold text-white">
                {options.title}
              </h3>
            </div>
            {options.description && (
              <p className="mb-5 text-sm text-muted-light">{options.description}</p>
            )}
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => handleClose(false)}>
                {options.cancelLabel ?? 'إلغاء'}
              </Button>
              <Button
                size="sm"
                variant={options.isDangerous ? 'danger' : 'primary'}
                onClick={() => handleClose(true)}
              >
                {options.confirmLabel ?? 'تأكيد'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within a ConfirmDialogProvider');
  return ctx;
}
