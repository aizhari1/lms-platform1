'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, XCircle, Clock, Trophy, ListChecks } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { Button } from '@/components/ui/button';

interface AnswerReview {
  id: string;
  questionId: string;
  selectedChoiceIds: string[];
  essayText: string | null;
  pointsAwarded: string | null;
  reviewerNote: string | null;
  question: {
    textAr: string;
    type: string;
    points: string;
    explanationAr: string | null;
    choices: { id: string; textAr: string; isCorrect: boolean; order: number }[];
  };
}

interface AttemptResult {
  id: string;
  status: string;
  gradingStatus: string;
  scoreObtained: string | null;
  scoreTotal: string | null;
  isPassed: boolean | null;
  exam: { titleAr: string; passScorePct: string };
  answers: AnswerReview[];
}

export function ExamResultClient({ attemptId, locale }: { attemptId: string; locale: string }) {
  const [result, setResult] = useState<AttemptResult | null>(null);

  useEffect(() => {
    apiClient.get(`/attempts/${attemptId}/result`).then((res) => setResult(res.data.data));
  }, [attemptId]);

  if (!result) {
    return (
      <div className="p-6">
        <div className="card-surface h-64 animate-pulse" />
      </div>
    );
  }

  const isPendingReview = result.gradingStatus === 'PENDING_MANUAL_REVIEW';
  const scorePct =
    result.scoreObtained && result.scoreTotal
      ? (Number(result.scoreObtained) / Number(result.scoreTotal)) * 100
      : 0;

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="card-surface flex flex-col items-center gap-4 p-10 text-center">
        {isPendingReview ? (
          <>
            <Clock size={48} className="text-siraj-400" />
            <h1 className="text-lg font-bold text-white">تم استلام إجاباتك</h1>
            <p className="text-sm text-muted">
              امتحانك يحتوي على أسئلة مقالية قيد المراجعة اليدوية من المدرّس. ستصلك نتيجتك النهائية قريبًا.
            </p>
          </>
        ) : result.isPassed ? (
          <>
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
              <Trophy size={36} className="text-success" />
            </div>
            <h1 className="text-xl font-bold text-white">مبروك! لقد نجحت 🎉</h1>
            <p className="font-display text-3xl font-extrabold text-siraj-400">
              {scorePct.toFixed(0)}%
            </p>
            <p className="text-sm text-muted">
              الحد الأدنى للنجاح: {result.exam.passScorePct}%
            </p>
          </>
        ) : (
          <>
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-danger/10">
              <XCircle size={36} className="text-danger" />
            </div>
            <h1 className="text-xl font-bold text-white">لم تحقق درجة النجاح</h1>
            <p className="font-display text-3xl font-extrabold text-danger">
              {scorePct.toFixed(0)}%
            </p>
            <p className="text-sm text-muted">
              الحد الأدنى للنجاح: {result.exam.passScorePct}% — يمكنك المحاولة مرة أخرى
            </p>
          </>
        )}

        <Link href={`/${locale}/student/dashboard`} className="mt-4 w-full">
          <Button className="w-full">العودة للوحة التحكم</Button>
        </Link>
      </div>

      {!isPendingReview && result.answers?.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
            <ListChecks size={18} className="text-siraj-400" /> مراجعة الإجابات
          </h2>
          <div className="space-y-3">
            {result.answers.map((answer) => {
              const isCorrect =
                answer.pointsAwarded !== null &&
                Number(answer.pointsAwarded) >= Number(answer.question.points);
              const correctChoices = answer.question.choices.filter((c) => c.isCorrect);

              return (
                <div key={answer.id} className="card-surface p-4 text-start">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-white">{answer.question.textAr}</p>
                    {answer.pointsAwarded !== null &&
                      (isCorrect ? (
                        <CheckCircle2 size={18} className="shrink-0 text-success" />
                      ) : (
                        <XCircle size={18} className="shrink-0 text-danger" />
                      ))}
                  </div>

                  {answer.question.type === 'ESSAY' || answer.question.type === 'FILL_BLANK' ? (
                    <p className="text-sm text-muted-light">إجابتك: {answer.essayText || '—'}</p>
                  ) : correctChoices.length > 0 ? (
                    <p className="text-sm text-muted-light">
                      الإجابة الصحيحة: {correctChoices.map((c) => c.textAr).join('، ')}
                    </p>
                  ) : null}

                  {answer.question.explanationAr && (
                    <p className="mt-2 rounded-lg bg-ink-soft p-3 text-xs text-muted">
                      💡 {answer.question.explanationAr}
                    </p>
                  )}

                  {answer.reviewerNote && (
                    <p className="mt-2 text-xs text-siraj-400">ملاحظة المدرّس: {answer.reviewerNote}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
