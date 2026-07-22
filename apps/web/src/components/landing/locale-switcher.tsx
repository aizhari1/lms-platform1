'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Globe } from 'lucide-react';
import { locales } from '@/i18n/config';

export function LocaleSwitcher({ currentLocale }: { currentLocale: string }) {
  const pathname = usePathname();
  const router = useRouter();

  function switchTo(nextLocale: string) {
    const segments = pathname.split('/');
    segments[1] = nextLocale;
    router.push(segments.join('/'));
  }

  const otherLocale = locales.find((l) => l !== currentLocale) ?? 'en';

  return (
    <button
      onClick={() => switchTo(otherLocale)}
      className="flex items-center gap-1.5 rounded-lg border border-ink-border px-3 py-2 text-xs font-semibold text-muted-light transition hover:border-siraj-500 hover:text-siraj-400"
      aria-label="Switch language"
    >
      <Globe size={14} />
      {otherLocale === 'ar' ? 'العربية' : 'English'}
    </button>
  );
}
