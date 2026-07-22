import { getTranslations } from 'next-intl/server';
import { BookOpenCheck, Code2, Landmark, Rocket } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export async function Stages() {
  const t = await getTranslations('stages');

  const items: { icon: LucideIcon; title: string; desc: string }[] = [
    { icon: BookOpenCheck, title: t('item1Title'), desc: t('item1Desc') },
    { icon: Code2, title: t('item2Title'), desc: t('item2Desc') },
    { icon: Landmark, title: t('item3Title'), desc: t('item3Desc') },
    { icon: Rocket, title: t('item4Title'), desc: t('item4Desc') },
  ];

  return (
    <section className="border-y border-ink-border bg-ink-soft py-20">
      <div className="container-page">
        <div className="mb-12 text-center">
          <span className="text-sm font-semibold text-siraj-400">{t('eyebrow')}</span>
          <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">{t('title')}</h2>
        </div>

        <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
          {items.map((item) => (
            <div
              key={item.title}
              className="card-surface group flex flex-col items-center gap-3 p-6 text-center transition hover:border-siraj-700/60"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-siraj-900/40 text-siraj-400 transition group-hover:bg-siraj-500 group-hover:text-white">
                <item.icon size={22} />
              </span>
              <h3 className="text-sm font-bold text-white">{item.title}</h3>
              <p className="text-xs leading-relaxed text-muted">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
