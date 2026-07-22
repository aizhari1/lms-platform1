export const locales = ['ar', 'en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'ar';

export const localeDirection: Record<Locale, 'rtl' | 'ltr'> = {
  ar: 'rtl',
  en: 'ltr',
};

export function isRtl(locale: string): boolean {
  return localeDirection[locale as Locale] === 'rtl';
}
