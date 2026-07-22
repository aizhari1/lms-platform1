import { getTranslations } from 'next-intl/server';
import { Flame } from 'lucide-react';

export async function Marquee() {
  const t = await getTranslations('marquee');
  const items = new Array(10).fill(t('phrase'));

  return (
    <div className="marquee-row overflow-hidden border-y border-ink-border bg-ink-soft py-4">
      <div className="marquee-track flex w-max items-center gap-10">
        {[...items, ...items].map((phrase, i) => (
          <span
            key={i}
            className="flex shrink-0 items-center gap-2 text-sm font-bold text-muted-light"
          >
            <Flame size={16} className="text-siraj-400" />
            {phrase}
          </span>
        ))}
      </div>
    </div>
  );
}
