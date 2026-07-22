import { getTranslations } from 'next-intl/server';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlanCard {
  name: string;
  price: string;
  period: string;
  features: string[];
  highlighted?: boolean;
}

export async function Pricing({ locale }: { locale: string }) {
  const t = await getTranslations('pricing');
  const isAr = locale === 'ar';

  const plans: PlanCard[] = [
    {
      name: isAr ? 'الباقة الأساسية' : 'Starter',
      price: isAr ? '299 ر.س' : 'SAR 299',
      period: isAr ? '/شهريًا' : '/month',
      features: isAr
        ? ['الوصول لـ 5 كورسات', 'شهادات إتمام', 'دعم عبر البريد']
        : ['Access to 5 courses', 'Completion certificates', 'Email support'],
    },
    {
      name: isAr ? 'الباقة الاحترافية' : 'Professional',
      price: isAr ? '499 ر.س' : 'SAR 499',
      period: isAr ? '/شهريًا' : '/month',
      highlighted: true,
      features: isAr
        ? ['وصول غير محدود لكل الكورسات', 'شهادات معتمدة بـ QR', 'دعم أولوية', 'جلسات مباشرة أسبوعية']
        : ['Unlimited access to all courses', 'QR-verified certificates', 'Priority support', 'Weekly live sessions'],
    },
    {
      name: isAr ? 'باقة الإنجاز' : 'Achievement',
      price: isAr ? '999 ر.س' : 'SAR 999',
      period: isAr ? '/3 أشهر' : '/3 months',
      features: isAr
        ? ['كل مزايا الباقة الاحترافية', 'مراجعة واجبات فردية', 'شهادة مطبوعة'] 
        : ['Everything in Professional', '1:1 assignment reviews', 'Printed certificate'],
    },
  ];

  return (
    <section className="container-page py-20">
      <div className="mb-14 text-center">
        <span className="text-sm font-semibold text-siraj-400">{t('eyebrow')}</span>
        <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">{t('title')}</h2>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={cn(
              'relative flex flex-col rounded-xl2 border p-8',
              plan.highlighted
                ? 'border-siraj-500 bg-gradient-to-b from-siraj-900/30 to-ink-card'
                : 'border-ink-border bg-ink-card',
            )}
          >
            {plan.highlighted && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-siraj-500 px-4 py-1 text-xs font-bold text-white">
                {t('mostPopular')}
              </span>
            )}

            <h3 className="text-lg font-bold text-white">{plan.name}</h3>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="font-display text-3xl font-extrabold text-siraj-400">
                {plan.price}
              </span>
              <span className="text-sm text-muted">{plan.period}</span>
            </div>

            <ul className="mt-6 flex-1 space-y-3">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-muted-light">
                  <Check size={16} className="mt-0.5 shrink-0 text-success" />
                  {feature}
                </li>
              ))}
            </ul>

            <button
              className={cn(
                'mt-8 rounded-xl px-6 py-3 font-display font-bold transition',
                plan.highlighted
                  ? 'bg-siraj-500 text-white hover:bg-siraj-400'
                  : 'border border-ink-border text-white hover:border-siraj-500 hover:text-siraj-400',
              )}
            >
              {t('cta')}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
