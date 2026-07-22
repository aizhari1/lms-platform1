import { getTranslations } from 'next-intl/server';
import {
  BookOpen,
  LineChart,
  ListChecks,
  ShieldCheck,
  Headset,
  Smartphone,
  type LucideIcon,
} from 'lucide-react';

export async function Features() {
  const t = await getTranslations('features');

  const items: { icon: LucideIcon; title: string; desc: string }[] = [
    { icon: BookOpen, title: t('item1Title'), desc: t('item1Desc') },
    { icon: LineChart, title: t('item2Title'), desc: t('item2Desc') },
    { icon: ListChecks, title: t('item3Title'), desc: t('item3Desc') },
    { icon: ShieldCheck, title: t('item4Title'), desc: t('item4Desc') },
    { icon: Headset, title: t('item5Title'), desc: t('item5Desc') },
    { icon: Smartphone, title: t('item6Title'), desc: t('item6Desc') },
  ];

  return (
    <section className="container-page py-20">
      <div className="mb-14 text-center">
        <span className="text-sm font-semibold text-siraj-400">{t('eyebrow')}</span>
        <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">{t('title')}</h2>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.title}
            className="card-surface group p-6 transition hover:border-siraj-700/60"
          >
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-siraj-900/40 text-siraj-400 transition group-hover:bg-siraj-500 group-hover:text-white">
              <item.icon size={22} />
            </div>
            <h3 className="mb-2 text-lg font-bold text-white">{item.title}</h3>
            <p className="text-sm leading-relaxed text-muted">{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
