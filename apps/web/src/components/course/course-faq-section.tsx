'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { fetchCourseFaqs, type CourseFaq } from '@/lib/api/course-extras';

export function CourseFaqSection({ courseId }: { courseId: string }) {
  const [faqs, setFaqs] = useState<CourseFaq[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    fetchCourseFaqs(courseId)
      .then(setFaqs)
      .catch(() => setFaqs([]));
  }, [courseId]);

  if (faqs.length === 0) return null;

  return (
    <section className="container-page border-t border-ink-border py-12">
      <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-white">
        <HelpCircle size={20} className="text-siraj-400" /> الأسئلة الشائعة
      </h2>
      <div className="mx-auto max-w-3xl space-y-2">
        {faqs.map((faq) => {
          const isOpen = openId === faq.id;
          return (
            <div key={faq.id} className="card-surface overflow-hidden">
              <button
                onClick={() => setOpenId(isOpen ? null : faq.id)}
                className="flex w-full items-center justify-between px-5 py-4 text-start"
              >
                <span className="text-sm font-bold text-white">{faq.questionAr}</span>
                <ChevronDown
                  size={18}
                  className={`shrink-0 text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {isOpen && (
                <p className="border-t border-ink-border px-5 py-4 text-sm text-muted-light">
                  {faq.answerAr}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
