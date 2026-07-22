import { getTranslations } from 'next-intl/server';
import { GraduationCap, Sparkles } from 'lucide-react';

export async function AboutTeaser() {
  const t = await getTranslations('aboutTeaser');

  return (
    <section className="container-page py-20">
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
        {/* Visual */}
        <div className="relative order-2 mx-auto w-full max-w-sm lg:order-1">
          <div className="pointer-events-none absolute -inset-6 rounded-[2rem] bg-lamp-glow-soft" />
          <div className="card-surface relative flex aspect-square flex-col items-center justify-center gap-4 p-10 text-center shadow-xl">
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-siraj-500/15 text-siraj-400">
              <GraduationCap size={36} />
            </span>
            <p className="font-display text-2xl font-extrabold text-siraj-500">سراج</p>
            <p className="text-sm text-muted">{t('badge')}</p>
          </div>
          <div className="card-surface absolute -bottom-5 -left-5 flex items-center gap-2 border-siraj-700/40 px-4 py-2.5 shadow-lg">
            <Sparkles size={16} className="text-siraj-400" />
            <span className="text-xs font-bold text-white">{t('floatingNote')}</span>
          </div>
        </div>

        {/* Copy */}
        <div className="order-1 text-center lg:order-2 lg:text-right">
          <span className="text-sm font-semibold text-siraj-400">{t('eyebrow')}</span>
          <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">{t('title')}</h2>
          <p className="mt-5 leading-relaxed text-muted-light">{t('body')}</p>
        </div>
      </div>
    </section>
  );
}
