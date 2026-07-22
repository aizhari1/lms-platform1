import Image from 'next/image';
import { Award } from 'lucide-react';

interface Achiever {
  name: string;
  courseName: string;
  score: string;
  rank: number;
  avatarUrl?: string;
}

const DEMO_ACHIEVERS: Achiever[] = [
  { name: 'يوسف أحمد', courseName: 'تطوير الويب الشامل', score: '99%', rank: 1 },
  { name: 'سارة محمود', courseName: 'أساسيات الشبكات', score: '98%', rank: 2 },
  { name: 'عمر خالد', courseName: 'قواعد البيانات', score: '97%', rank: 3 },
  { name: 'ملك حسن', courseName: 'React المتقدم', score: '96%', rank: 4 },
  { name: 'كريم سيد', courseName: 'تصميم الواجهات', score: '96%', rank: 5 },
  { name: 'نور الدين', courseName: 'أمن المعلومات', score: '95%', rank: 6 },
];

const RANK_STYLES: Record<number, string> = {
  1: 'border-siraj-400 shadow-[0_0_24px_rgba(245,184,74,0.35)]',
  2: 'border-siraj-500/70',
  3: 'border-siraj-600/50',
};

export function Achievers() {
  return (
    <section className="border-y border-ink-border bg-ink-soft py-20">
      <div className="container-page">
        <div className="mb-12 text-center">
          <span className="text-sm font-semibold text-siraj-400">قصص نجاح</span>
          <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">أوائل طلاب سراج</h2>
          <p className="mt-3 text-muted">نفخر بكل طالب أضاء طريقه بالعلم والاجتهاد</p>
        </div>

        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
          {DEMO_ACHIEVERS.map((achiever) => (
            <div
              key={achiever.rank}
              className={`card-surface relative flex flex-col items-center border p-5 pt-8 text-center ${
                RANK_STYLES[achiever.rank] ?? 'border-ink-border'
              }`}
            >
              <span className="absolute -top-3 flex h-7 w-7 items-center justify-center rounded-full bg-siraj-500 text-xs font-bold text-white">
                {achiever.rank}
              </span>

              <div className="mb-3 flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-ink-border">
                {achiever.avatarUrl ? (
                  <Image src={achiever.avatarUrl} alt={achiever.name} width={64} height={64} />
                ) : (
                  <span className="font-display text-lg font-bold text-siraj-400">
                    {achiever.name.charAt(0)}
                  </span>
                )}
              </div>

              <h3 className="text-sm font-bold text-white">{achiever.name}</h3>
              <p className="mt-1 line-clamp-1 text-xs text-muted">{achiever.courseName}</p>

              <div className="mt-3 flex items-center gap-1 text-siraj-400">
                <Award size={14} />
                <span className="text-sm font-bold">{achiever.score}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
