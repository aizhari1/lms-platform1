import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, PlayCircle, TrendingUp, Users } from 'lucide-react';
import { isRtl } from '@/i18n/config';
import { LampSignature } from './lamp-signature';

export async function Hero({ locale }: { locale: string }) {
  const t = await getTranslations('hero');
  const rtl = isRtl(locale);
  const Arrow = rtl ? ArrowLeft : ArrowRight;

  return (
    <section className="relative overflow-hidden pt-16 pb-20 sm:pt-24 sm:pb-28">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[560px] bg-lamp-glow" />
      <LampSignature />

      <div className="container-page relative grid grid-cols-1 items-center gap-14 lg:grid-cols-2 lg:gap-10">
        {/* Copy column */}
        <div className="flex flex-col items-center text-center lg:items-start lg:text-right">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-siraj-700/50 bg-siraj-900/30 px-4 py-1.5 text-xs font-semibold text-siraj-300">
            {t('eyebrow')}
          </span>

          <h1 className="max-w-xl text-4xl font-extrabold leading-[1.15] sm:text-5xl lg:text-6xl">
            {t('title')}
          </h1>

          <p className="mt-6 max-w-lg text-base leading-relaxed text-muted-light sm:text-lg">
            {t('subtitle')}
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link href={`/${locale}/register`} className="btn-primary group">
              {t('ctaPrimary')}
              <Arrow size={18} className="transition group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
            </Link>
            <Link href={`/${locale}/courses`} className="btn-outline">
              {t('ctaSecondary')}
            </Link>
          </div>

          <div className="mt-14 grid w-full max-w-md grid-cols-3 gap-6 border-t border-ink-border pt-8">
            <Stat value="+12,000" label={t('stat1Label')} />
            <Stat value="+180" label={t('stat2Label')} />
            <Stat value="%96" label={t('stat3Label')} />
          </div>
        </div>

        {/* Visual column — layered mockup, standing in for a banner collage */}
        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="relative aspect-[4/5] w-full">
            <div className="pointer-events-none absolute inset-0 rounded-[2rem] bg-lamp-glow-soft" />

            {/* Main panel — progress-style dashboard card */}
            <div className="card-surface absolute inset-0 flex flex-col gap-4 overflow-hidden p-6 shadow-2xl">
              <div className="flex items-center justify-between">
                <span className="font-display text-sm font-bold text-white">مسارك التعليمي</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-siraj-500/20 text-siraj-400">
                  <TrendingUp size={16} />
                </span>
              </div>

              <div className="space-y-3">
                {[78, 54, 92].map((pct, i) => (
                  <div key={i} className="rounded-xl border border-ink-border bg-ink-soft p-3">
                    <div className="mb-2 flex items-center justify-between text-xs text-muted">
                      <span>كورس {i + 1}</span>
                      <span className="font-bold text-siraj-400">{pct}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-border">
                      <div className="h-full rounded-full bg-siraj-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-auto flex items-center gap-3 rounded-xl border border-siraj-700/40 bg-siraj-900/20 p-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-siraj-500 text-white">
                  <PlayCircle size={18} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-white">الدرس القادم: مقدمة React</p>
                  <p className="text-[11px] text-muted">14 دقيقة متبقية</p>
                </div>
              </div>
            </div>

            {/* Floating badge card — students */}
            <div className="card-surface absolute -bottom-6 -right-4 flex items-center gap-3 border-siraj-700/40 p-4 shadow-xl sm:-right-8">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-siraj-500/20 text-siraj-400">
                <Users size={18} />
              </span>
              <div>
                <p className="font-display text-sm font-extrabold text-white">+12,000</p>
                <p className="text-[11px] text-muted">طالب مسجّل</p>
              </div>
            </div>

            {/* Floating badge card — satisfaction */}
            <div className="card-surface absolute -top-5 -left-4 flex items-center gap-2 border-siraj-700/40 px-4 py-2.5 shadow-xl sm:-left-8">
              <span className="font-display text-sm font-extrabold text-siraj-400">%96</span>
              <span className="text-[11px] text-muted">رضا الطلاب</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center lg:items-start">
      <span className="font-display text-2xl font-extrabold text-siraj-400 sm:text-3xl">
        {value}
      </span>
      <span className="mt-1 text-xs text-muted sm:text-sm">{label}</span>
    </div>
  );
}
