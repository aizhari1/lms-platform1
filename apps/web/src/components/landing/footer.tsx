import { getTranslations } from 'next-intl/server';
import { Facebook, Youtube, Instagram } from 'lucide-react';

export async function Footer() {
  const t = await getTranslations('footer');

  return (
    <footer className="border-t border-ink-border py-10">
      <div className="container-page flex flex-col items-center gap-6 text-center sm:flex-row sm:justify-between sm:text-right">
        <div>
          <span className="font-display text-lg font-extrabold text-siraj-500">سراج</span>
          <p className="mt-1 text-xs text-muted">{t('tagline')}</p>
        </div>

        <div className="flex items-center gap-4 text-muted">
          <a href="#" aria-label="Facebook" className="transition hover:text-siraj-400">
            <Facebook size={18} />
          </a>
          <a href="#" aria-label="YouTube" className="transition hover:text-siraj-400">
            <Youtube size={18} />
          </a>
          <a href="#" aria-label="Instagram" className="transition hover:text-siraj-400">
            <Instagram size={18} />
          </a>
        </div>

        <div className="flex flex-col items-center gap-1 sm:items-end">
          <span className="text-[11px] text-muted">{t('poweredBy')}</span>
          <p className="text-xs text-muted">© 2026 سراج — {t('rights')}</p>
        </div>
      </div>
    </footer>
  );
}
