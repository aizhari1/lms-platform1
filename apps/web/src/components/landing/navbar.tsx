'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { LocaleSwitcher } from './locale-switcher';

export function Navbar({ locale }: { locale: string }) {
  const t = useTranslations('nav');
  const [open, setOpen] = useState(false);

  const links = [
    { href: `/${locale}/courses`, label: t('courses') },
    { href: `/${locale}/about`, label: t('about') },
    { href: `/${locale}/pricing`, label: t('pricing') },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-ink-border/60 bg-ink/80 backdrop-blur-md">
      <nav className="container-page flex h-16 items-center justify-between">
        <Link href={`/${locale}`} className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <span className="font-display text-xl font-extrabold text-siraj-500">سراج</span>
          <span className="hidden text-sm text-muted sm:inline">SIRAJ</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted-light transition hover:text-siraj-400"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <LocaleSwitcher currentLocale={locale} />
          </div>
          <Link
            href={`/${locale}/login`}
            className="hidden text-sm font-semibold text-muted-light transition hover:text-white sm:inline"
          >
            {t('login')}
          </Link>
          <Link href={`/${locale}/register`} className="btn-primary !px-5 !py-2.5 text-sm">
            {t('register')}
          </Link>
          <button
            className="text-white md:hidden"
            aria-label={open ? 'Close menu' : 'Menu'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      <div
        className={`overflow-hidden border-t border-ink-border/60 bg-ink transition-[max-height] duration-300 ease-in-out md:hidden ${
          open ? 'max-h-96' : 'max-h-0'
        }`}
      >
        <div className="container-page flex flex-col gap-1 py-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-3 text-sm font-medium text-muted-light transition hover:bg-ink-card hover:text-siraj-400"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href={`/${locale}/login`}
            onClick={() => setOpen(false)}
            className="rounded-lg px-3 py-3 text-sm font-semibold text-muted-light transition hover:bg-ink-card hover:text-white"
          >
            {t('login')}
          </Link>
          <div className="px-3 pt-2">
            <LocaleSwitcher currentLocale={locale} />
          </div>
        </div>
      </div>
    </header>
  );
}
