'use client';

import { useState } from 'react';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ExamQuestion } from '@/lib/api/exam';

interface QuestionCardProps {
  question: ExamQuestion;
  index: number;
  selectedChoiceIds: string[];
  essayText: string;
  matchingAnswers: { choiceId: string; submittedMatch: string }[];
  onSelectChoice: (choiceId: string) => void;
  onEssayChange: (text: string) => void;
  onOrderChange: (orderedChoiceIds: string[]) => void;
  onMatchChange: (choiceId: string, submittedMatch: string) => void;
}

export function QuestionCard({
  question,
  index,
  selectedChoiceIds,
  essayText,
  matchingAnswers,
  onSelectChoice,
  onEssayChange,
  onOrderChange,
  onMatchChange,
}: QuestionCardProps) {
  const isMultiple = question.type === 'MCQ_MULTIPLE';

  return (
    <div className="card-surface p-6">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-siraj-500 text-xs font-bold text-white">
          {index + 1}
        </span>
        <div className="flex-1">
          <p className="font-semibold text-white">{question.textAr}</p>
          <p className="mt-1 text-xs text-muted">{question.points} نقطة</p>
        </div>
      </div>

      {(question.type === 'ESSAY' || question.type === 'FILL_BLANK') && (
        <textarea
          value={essayText}
          onChange={(e) => onEssayChange(e.target.value)}
          rows={question.type === 'FILL_BLANK' ? 1 : 4}
          placeholder={question.type === 'FILL_BLANK' ? 'اكتب الإجابة...' : 'اكتب إجابتك هنا...'}
          className="w-full rounded-xl border border-ink-border bg-ink-soft px-4 py-3 text-sm text-white placeholder:text-muted focus:border-siraj-500 focus:outline-none focus:ring-1 focus:ring-siraj-500"
        />
      )}

      {(question.type === 'MCQ_SINGLE' ||
        question.type === 'MCQ_MULTIPLE' ||
        question.type === 'TRUE_FALSE') && (
        <div className="space-y-2 ltr:pl-10 rtl:pr-10">
          {question.choices.map((choice) => {
            const isSelected = selectedChoiceIds.includes(choice.id);
            return (
              <button
                key={choice.id}
                type="button"
                onClick={() => onSelectChoice(choice.id)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-right text-sm transition',
                  isSelected
                    ? 'border-siraj-500 bg-siraj-900/20 text-siraj-300'
                    : 'border-ink-border text-muted-light hover:border-ink-border/70',
                )}
              >
                <span
                  className={cn(
                    'flex h-4 w-4 shrink-0 items-center justify-center border',
                    isMultiple ? 'rounded-md' : 'rounded-full',
                    isSelected ? 'border-siraj-500 bg-siraj-500' : 'border-muted',
                  )}
                >
                  {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-ink" />}
                </span>
                {choice.textAr}
              </button>
            );
          })}
        </div>
      )}

      {question.type === 'MATCHING' && (
        <div className="space-y-3">
          {question.choices.map((choice) => {
            const current = matchingAnswers.find((m) => m.choiceId === choice.id)?.submittedMatch ?? '';
            return (
              <div key={choice.id} className="flex items-center gap-3">
                <span className="flex-1 rounded-xl border border-ink-border bg-ink-soft px-4 py-2.5 text-sm text-white">
                  {choice.textAr}
                </span>
                <select
                  value={current}
                  onChange={(e) => onMatchChange(choice.id, e.target.value)}
                  className="flex-1 rounded-xl border border-ink-border bg-ink-soft px-4 py-2.5 text-sm text-white focus:border-siraj-500 focus:outline-none"
                >
                  <option value="">اختر التطابق...</option>
                  {question.matchOptions?.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
      )}

      {question.type === 'ORDERING' && (
        <OrderingList
          choices={question.choices}
          orderedIds={selectedChoiceIds.length ? selectedChoiceIds : question.choices.map((c) => c.id)}
          onOrderChange={onOrderChange}
        />
      )}
    </div>
  );
}

function OrderingList({
  choices,
  orderedIds,
  onOrderChange,
}: {
  choices: { id: string; textAr: string }[];
  orderedIds: string[];
  onOrderChange: (orderedChoiceIds: string[]) => void;
}) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const byId = new Map(choices.map((c) => [c.id, c]));

  function handleDrop(targetId: string) {
    if (!draggedId || draggedId === targetId) return;
    const next = [...orderedIds];
    const fromIdx = next.indexOf(draggedId);
    const toIdx = next.indexOf(targetId);
    next.splice(fromIdx, 1);
    next.splice(toIdx, 0, draggedId);
    onOrderChange(next);
    setDraggedId(null);
  }

  return (
    <div className="space-y-2">
      <p className="mb-2 text-xs text-muted">اسحب العناصر لترتيبها بالترتيب الصحيح</p>
      {orderedIds.map((id, idx) => {
        const choice = byId.get(id);
        if (!choice) return null;
        return (
          <div
            key={id}
            draggable
            onDragStart={() => setDraggedId(id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(id)}
            className="flex cursor-move items-center gap-3 rounded-xl border border-ink-border bg-ink-soft px-4 py-3 text-sm text-white"
          >
            <GripVertical size={16} className="text-muted" />
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-siraj-900/40 text-xs font-bold text-siraj-400">
              {idx + 1}
            </span>
            {choice.textAr}
          </div>
        );
      })}
    </div>
  );
}
