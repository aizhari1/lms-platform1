import { getRequestConfig } from 'next-intl/server';
import { locales, defaultLocale } from './config';

export default getRequestConfig(async ({ requestLocale }) => {
  // `requestLocale` is a Promise in next-intl 3.22+ (replaces the old
  // synchronous `locale` argument, which is deprecated and removed in
  // next-intl v4). Awaiting it lets Next.js stream the response before
  // the locale has fully resolved, and lets us fall back safely instead
  // of calling notFound() on every unmatched/undefined value.
  const requested = await requestLocale;
  const locale = locales.includes(requested as (typeof locales)[number])
    ? (requested as (typeof locales)[number])
    : defaultLocale;

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
