'use client';

import { useEffect, useState } from 'react';
import { ClipboardList, CheckCircle2, Clock, XCircle, PlayCircle, Send, GraduationCap } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { fetchMyAttemptsTimeline, type TimelineEvent } from '@/lib/api/exam';
import { cn } from '@/lib/utils';

interface AttemptRow {
  id: string;
  status: string;
  gradingStatus: string;
  isPassed: boolean | null;
  scoreObtained: string | null;
  scoreTotal: string | null;
  startedAt: string;
  exam: { titleAr: string; course: { titleAr: string } | null };
}

const STATUS_CONFIG: Record<string, { label: string; icon: typeof Clock; className: string }> = {
  PENDING_MANUAL_REVIEW: { label: 'قيد المراجعة', icon: Clock, className: 'text-siraj-400' },
  AUTO_GRADED: { label: 'مصحّح', icon: CheckCircle2, className: 'text-success' },
  REVIEWED: { label: 'تم التصحيح', icon: CheckCircle2, className: 'text-success' },
};

const STAGE_CONFIG: Record<TimelineEvent['stage'], { label: string; icon: typeof Clock }> = {
  STARTED: { label: 'بدأت المحاولة', icon: PlayCircle },
  SUBMITTED: { label: 'تم التسليم', icon: Send },
  GRADED: { label: 'تم التصحيح', icon: GraduationCap },
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('ar-EG', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AssignmentsClient() {
  const [tab, setTab] = useState<'list' | 'timeline'>('list');
  const [attempts, setAttempts] = useState<AttemptRow[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiClient.get('/my-attempts').then((res) => res.data.data),
      fetchMyAttemptsTimeline().catch(() => []),
    ])
      .then(([a, t]) => {
        setAttempts(a);
        setTimeline(t);
      })
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-3 p-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card-surface h-20 animate-pulse" />
        ))}
      </div>
    );
  }

  if (attempts.length === 0) {
    return (
      <div className="p-6">
        <div className="card-surface flex flex-col items-center gap-3 p-12 text-center">
          <ClipboardList size={40} className="text-muted" />
          <p className="text-muted">لم تؤدِ أي امتحانات أو واجبات بعد</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-2 border-b border-ink-border">
        <button
          onClick={() => setTab('list')}
          className={`border-b-2 px-4 py-2.5 text-sm font-bold transition ${
            tab === 'list'
              ? 'border-siraj-500 text-white'
              : 'border-transparent text-muted-light hover:text-white'
          }`}
        >
          كل المحاولات
        </button>
        <button
          onClick={() => setTab('timeline')}
          className={`border-b-2 px-4 py-2.5 text-sm font-bold transition ${
            tab === 'timeline'
              ? 'border-siraj-500 text-white'
              : 'border-transparent text-muted-light hover:text-white'
          }`}
        >
          الجدول الزمني
        </button>
      </div>

      {tab === 'list' ? (
        <div className="space-y-3">
          {attempts.map((attempt) => {
            const config = STATUS_CONFIG[attempt.gradingStatus] ?? STATUS_CONFIG.AUTO_GRADED;
            const scorePct =
              attempt.scoreObtained && attempt.scoreTotal
                ? (Number(attempt.scoreObtained) / Number(attempt.scoreTotal)) * 100
                : null;

            return (
              <div key={attempt.id} className="card-surface flex items-center gap-4 p-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-siraj-900/40 text-siraj-400">
                  <ClipboardList size={18} />
                </div>

                <div className="flex-1">
                  <h3 className="text-sm font-bold text-white">{attempt.exam.titleAr}</h3>
                  <p className="text-xs text-muted">{attempt.exam.course?.titleAr ?? '—'}</p>
                </div>

                {scorePct !== null && (
                  <span className="font-display text-lg font-extrabold text-siraj-400">
                    {scorePct.toFixed(0)}%
                  </span>
                )}

                <span className={cn('flex items-center gap-1.5 text-xs font-semibold', config.className)}>
                  <config.icon size={14} />
                  {config.label}
                </span>

                {attempt.isPassed !== null && (
                  attempt.isPassed ? (
                    <CheckCircle2 size={18} className="text-success" />
                  ) : (
                    <XCircle size={18} className="text-danger" />
                  )
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="relative space-y-6 ltr:pl-6 rtl:pr-6">
          <div className="absolute top-1 bottom-1 w-px bg-ink-border ltr:left-2 rtl:right-2" />
          {timeline.map((event, idx) => {
            const stage = STAGE_CONFIG[event.stage];
            return (
              <div key={`${event.attemptId}-${event.stage}-${idx}`} className="relative flex gap-4">
                <span className="absolute flex h-4 w-4 items-center justify-center rounded-full bg-siraj-500 ltr:-left-6 rtl:-right-6" />
                <div className="card-surface flex-1 p-4">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-siraj-400">
                      <stage.icon size={14} /> {stage.label}
                    </span>
                    <span className="text-xs text-muted">{formatDateTime(event.date)}</span>
                  </div>
                  <h3 className="text-sm font-bold text-white">{event.examTitle}</h3>
                  <p className="text-xs text-muted">{event.courseTitle ?? '—'}</p>
                  {event.stage === 'GRADED' && event.scoreObtained && event.scoreTotal && (
                    <p className="mt-2 text-xs font-semibold text-siraj-400">
                      النتيجة: {event.scoreObtained} / {event.scoreTotal}
                      {event.isPassed !== null && (event.isPassed ? ' — ناجح ✅' : ' — راسب ❌')}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
