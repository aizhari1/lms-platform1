import { toast as sonnerToast } from 'sonner';

/**
 * Better Toast Messages — a thin wrapper around sonner (previously an
 * unused dependency) so every part of the app raises feedback the same
 * way, in Arabic by default, instead of ad-hoc `alert()` calls.
 */
export const toast = {
  success: (message: string) => sonnerToast.success(message),
  error: (message: string = 'حصل خطأ، حاول تاني') => sonnerToast.error(message),
  info: (message: string) => sonnerToast(message),
  loading: (message: string) => sonnerToast.loading(message),
  promise: <T,>(
    promise: Promise<T>,
    messages: { loading: string; success: string; error: string },
  ) => sonnerToast.promise(promise, messages),
};
