'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import {
  CalendarDays,
  CheckCircle2,
  Circle,
  Trash2,
  Video,
  Plus,
} from 'lucide-react';
import {
  fetchMyCalendar,
  createStudyPlanItem,
  updateStudyPlanItem,
  deleteStudyPlanItem,
  type CalendarEvent,
} from '@/lib/api/study-planner';
import { Button } from '@/components/ui/button';

function formatDateHeading(iso: string) {
  return new Date(iso).toLocaleDateString('ar-EG', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
}

function groupByDay(events: CalendarEvent[]) {
  const groups = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    const dayKey = new Date(event.date).toDateString();
    if (!groups.has(dayKey)) groups.set(dayKey, []);
    groups.get(dayKey)!.push(event);
  }
  return Array.from(groups.entries());
}

interface FormValues {
  titleAr: string;
  dueDate: string;
  notes?: string;
}

export function StudyPlannerClient({ locale }: { locale: string }) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<FormValues>();

  function loadCalendar() {
    fetchMyCalendar()
      .then(setEvents)
      .catch(() => setEvents([]))
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    loadCalendar();
  }, []);

  async function onSubmit(values: FormValues) {
    await createStudyPlanItem({
      titleAr: values.titleAr,
      notes: values.notes,
      dueDate: new Date(values.dueDate).toISOString(),
    });
    reset();
    setShowForm(false);
    setIsLoading(true);
    loadCalendar();
  }

  async function handleToggleComplete(event: CalendarEvent) {
    if (event.type !== 'STUDY_TASK') return;
    const itemId = event.id.replace('plan-', '');
    await updateStudyPlanItem(itemId, { isCompleted: !event.isCompleted });
    setEvents((prev) =>
      prev.map((e) => (e.id === event.id ? { ...e, isCompleted: !e.isCompleted } : e)),
    );
  }

  async function handleDelete(event: CalendarEvent) {
    if (event.type !== 'STUDY_TASK') return;
    const itemId = event.id.replace('plan-', '');
    await deleteStudyPlanItem(itemId);
    setEvents((prev) => prev.filter((e) => e.id !== event.id));
  }

  const groups = groupByDay(events);

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">التقويم الدراسي</h2>
        <Button size="sm" onClick={() => setShowForm((v) => !v)}>
          <Plus size={14} className="ml-1.5" /> إضافة مهمة دراسية
        </Button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="card-surface mb-6 grid grid-cols-1 gap-3 p-4 sm:grid-cols-3"
        >
          <input
            {...register('titleAr', { required: true })}
            placeholder="عنوان المهمة"
            className="rounded-xl border border-ink-border bg-ink-soft px-4 py-2.5 text-sm text-white placeholder:text-muted focus:border-siraj-500 focus:outline-none"
          />
          <input
            {...register('dueDate', { required: true })}
            type="datetime-local"
            className="rounded-xl border border-ink-border bg-ink-soft px-4 py-2.5 text-sm text-white focus:border-siraj-500 focus:outline-none"
          />
          <div className="flex gap-2">
            <input
              {...register('notes')}
              placeholder="ملاحظات (اختياري)"
              className="flex-1 rounded-xl border border-ink-border bg-ink-soft px-4 py-2.5 text-sm text-white placeholder:text-muted focus:border-siraj-500 focus:outline-none"
            />
            <Button type="submit" size="sm" isLoading={isSubmitting}>
              حفظ
            </Button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card-surface h-20 animate-pulse" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="card-surface flex flex-col items-center gap-3 p-12 text-center">
          <CalendarDays size={40} className="text-siraj-500" />
          <p className="text-muted">
            مفيش حاجة متجدولة — ضيف مهمة دراسية أو استنى مواعيد البث المباشر لكورساتك
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(([dayKey, dayEvents]) => (
            <div key={dayKey}>
              <h3 className="mb-3 text-sm font-bold text-siraj-400">
                {formatDateHeading(dayEvents[0].date)}
              </h3>
              <div className="space-y-2">
                {dayEvents.map((event) => (
                  <div key={event.id} className="card-surface flex items-center gap-3 p-4">
                    {event.type === 'STUDY_TASK' ? (
                      <button onClick={() => handleToggleComplete(event)} aria-label="تعليم كمكتمل">
                        {event.isCompleted ? (
                          <CheckCircle2 size={20} className="text-success" />
                        ) : (
                          <Circle size={20} className="text-muted" />
                        )}
                      </button>
                    ) : (
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-siraj-900/40 text-siraj-400">
                        <Video size={14} />
                      </span>
                    )}

                    <div className="flex-1">
                      <p
                        className={`text-sm font-semibold ${
                          event.isCompleted ? 'text-muted line-through' : 'text-white'
                        }`}
                      >
                        {event.title}
                      </p>
                      {event.course && (
                        <Link
                          href={`/${locale}/course/${event.course.slug}`}
                          className="text-xs text-siraj-400 hover:underline"
                        >
                          {event.course.titleAr}
                        </Link>
                      )}
                    </div>

                    <span className="text-xs text-muted">{formatTime(event.date)}</span>

                    {event.type === 'STUDY_TASK' && (
                      <button
                        onClick={() => handleDelete(event)}
                        className="text-muted hover:text-danger"
                        aria-label="حذف"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}

                    {event.type === 'LIVE_SESSION' && event.meetingUrl && (
                      <a
                        href={event.meetingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-siraj-400 hover:underline"
                      >
                        انضم
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
