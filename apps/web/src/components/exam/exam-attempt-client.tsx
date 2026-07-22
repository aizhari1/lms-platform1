'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import { startExamAttempt, submitExamAttempt, type StartAttemptResponse } from '@/lib/api/exam';
import { ExamTimer } from './exam-timer';
import { QuestionCard } from './question-card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';

interface AnswerState {
  selectedChoiceIds: string[];
  essayText: string;
  matchingAnswers: { choiceId: string; submittedMatch: string }[];
}

export function ExamAttemptClient({
  examId,
  locale,
}: {
  examId: string;
  locale: string;
}) {
  const router = useRouter();
  const [session, setSession] = useState<StartAttemptResponse | null>(null);
  const [answers, setAnswers] = useState<Record<string, AnswerState>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasSubmittedRef = useRef(false);

  useEffect(() => {
    startExamAttempt(examId)
      .then((data) => {
        setSession(data);
        const initialAnswers: Record<string, AnswerState> = {};
        data.questions.forEach((q) => {
          initialAnswers[q.id] = { selectedChoiceIds: [], essayText: '', matchingAnswers: [] };
        });
        setAnswers(initialAnswers);
      })
      .catch((err) => setError(err?.response?.data?.message ?? 'تعذّر بدء الامتحان'));
  }, [examId]);

  const handleSubmit = useCallback(async () => {
    if (!session || hasSubmittedRef.current) return;
    hasSubmittedRef.current = true;
    setIsSubmitting(true);

    const payload = session.questions.map((q) => ({
      questionId: q.id,
      selectedChoiceIds: answers[q.id]?.selectedChoiceIds ?? [],
      essayText: answers[q.id]?.essayText,
      matchingAnswers: answers[q.id]?.matchingAnswers ?? [],
    }));

    try {
      const result = await submitExamAttempt(session.attemptId, payload);
      router.push(`/${locale}/student/exams/${examId}/result/${result.id}`);
    } catch {
      setError('حدث خطأ أثناء تسليم الامتحان، حاول مرة أخرى');
      hasSubmittedRef.current = false;
      setIsSubmitting(false);
    }
  }, [session, answers, examId, locale, router]);

  function toggleChoice(questionId: string, choiceId: string, isMultiple: boolean) {
    setAnswers((prev) => {
      const current = prev[questionId]?.selectedChoiceIds ?? [];
      const next = isMultiple
        ? current.includes(choiceId)
          ? current.filter((id) => id !== choiceId)
          : [...current, choiceId]
        : [choiceId];
      return { ...prev, [questionId]: { ...prev[questionId], selectedChoiceIds: next } };
    });
  }

  function setEssayText(questionId: string, text: string) {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], essayText: text },
    }));
  }

  function setOrder(questionId: string, orderedChoiceIds: string[]) {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], selectedChoiceIds: orderedChoiceIds },
    }));
  }

  function setMatch(questionId: string, choiceId: string, submittedMatch: string) {
    setAnswers((prev) => {
      const current = prev[questionId]?.matchingAnswers ?? [];
      const next = [
        ...current.filter((m) => m.choiceId !== choiceId),
        { choiceId, submittedMatch },
      ];
      return { ...prev, [questionId]: { ...prev[questionId], matchingAnswers: next } };
    });
  }

  // Keyboard Shortcuts: arrow keys move between questions, Enter
  // submits on the last one — handy for quickly working through an exam
  // without reaching for the mouse every time.
  useKeyboardShortcuts({
    ArrowRight: () => {
      if (!session) return;
      setCurrentIndex((i) => Math.min(i + 1, session.questions.length - 1));
    },
    ArrowLeft: () => setCurrentIndex((i) => Math.max(i - 1, 0)),
    Enter: () => {
      if (!session) return;
      if (currentIndex === session.questions.length - 1) {
        handleSubmit();
      } else {
        setCurrentIndex((i) => Math.min(i + 1, session.questions.length - 1));
      }
    },
  });

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="card-surface flex max-w-md flex-col items-center gap-3 p-10 text-center">
          <AlertTriangle size={32} className="text-danger" />
          <p className="text-muted-light">{error}</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="p-6">
        <div className="card-surface h-96 animate-pulse" />
      </div>
    );
  }

  const currentQuestion = session.questions[currentIndex];
  const answeredCount = Object.values(answers).filter(
    (a) =>
      a.selectedChoiceIds.length > 0 ||
      a.essayText.trim().length > 0 ||
      a.matchingAnswers.length > 0,
  ).length;

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white">الامتحان</h1>
          <p className="text-xs text-muted">
            {answeredCount} من {session.questions.length} تم الإجابة عليها
          </p>
        </div>
        <ExamTimer
          startedAt={session.startedAt}
          durationMin={session.durationMin}
          onExpire={handleSubmit}
        />
      </div>

      {/* Question navigator */}
      <div className="mb-6 flex flex-wrap gap-2">
        {session.questions.map((q, idx) => {
          const isAnswered =
            answers[q.id]?.selectedChoiceIds.length > 0 ||
            answers[q.id]?.essayText.trim().length > 0 ||
            answers[q.id]?.matchingAnswers.length > 0;
          return (
            <button
              key={q.id}
              onClick={() => setCurrentIndex(idx)}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition',
                idx === currentIndex
                  ? 'bg-siraj-500 text-white'
                  : isAnswered
                    ? 'bg-success/20 text-success'
                    : 'bg-ink-card text-muted',
              )}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      <QuestionCard
        question={currentQuestion}
        index={currentIndex}
        selectedChoiceIds={answers[currentQuestion.id]?.selectedChoiceIds ?? []}
        essayText={answers[currentQuestion.id]?.essayText ?? ''}
        matchingAnswers={answers[currentQuestion.id]?.matchingAnswers ?? []}
        onSelectChoice={(choiceId) =>
          toggleChoice(currentQuestion.id, choiceId, currentQuestion.type === 'MCQ_MULTIPLE')
        }
        onEssayChange={(text) => setEssayText(currentQuestion.id, text)}
        onOrderChange={(orderedIds) => setOrder(currentQuestion.id, orderedIds)}
        onMatchChange={(choiceId, match) => setMatch(currentQuestion.id, choiceId, match)}
      />

      <div className="mt-6 flex items-center justify-between">
        <Button
          variant="outline"
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex((i) => i - 1)}
        >
          السابق
        </Button>

        {currentIndex === session.questions.length - 1 ? (
          <Button onClick={handleSubmit} isLoading={isSubmitting}>
            تسليم الامتحان
          </Button>
        ) : (
          <Button onClick={() => setCurrentIndex((i) => i + 1)}>التالي</Button>
        )}
      </div>
    </div>
  );
}
