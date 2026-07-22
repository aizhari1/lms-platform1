import { CheckCircle2, ListChecks } from 'lucide-react';

export function CourseOutcomesSection({
  outcomes,
  requirements,
}: {
  outcomes: string[];
  requirements: string[];
}) {
  if (outcomes.length === 0 && requirements.length === 0) return null;

  return (
    <section className="container-page border-t border-ink-border py-12">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        {outcomes.length > 0 && (
          <div>
            <h2 className="mb-5 flex items-center gap-2 text-xl font-bold text-white">
              <CheckCircle2 size={20} className="text-siraj-400" /> هتتعلم إيه في الكورس ده
            </h2>
            <ul className="space-y-3">
              {outcomes.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-muted-light">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-siraj-400" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {requirements.length > 0 && (
          <div>
            <h2 className="mb-5 flex items-center gap-2 text-xl font-bold text-white">
              <ListChecks size={20} className="text-siraj-400" /> المتطلبات الأساسية
            </h2>
            <ul className="space-y-3">
              {requirements.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-muted-light">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-siraj-400" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
