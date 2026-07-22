'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { LifeBuoy, Plus, MessageSquare } from 'lucide-react';
import { fetchMyTickets, createTicket, type TicketSummary } from '@/lib/api/support-tickets';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  OPEN: { label: 'مفتوحة', className: 'bg-siraj-900/40 text-siraj-400' },
  IN_PROGRESS: { label: 'قيد المعالجة', className: 'bg-amber-500/10 text-amber-400' },
  RESOLVED: { label: 'تم الحل', className: 'bg-green-500/10 text-green-400' },
  CLOSED: { label: 'مغلقة', className: 'bg-ink-soft text-muted' },
};

const CATEGORIES = [
  { value: 'GENERAL', label: 'استفسار عام' },
  { value: 'TECHNICAL', label: 'مشكلة تقنية' },
  { value: 'BILLING', label: 'الفواتير والمدفوعات' },
  { value: 'COURSE_CONTENT', label: 'محتوى الكورس' },
  { value: 'ACCOUNT', label: 'الحساب' },
];

interface FormValues {
  subject: string;
  message: string;
  category: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long' });
}

export function SupportTicketsClient({ locale }: { locale: string }) {
  const [tickets, setTickets] = useState<TicketSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<FormValues>();

  function loadTickets() {
    fetchMyTickets()
      .then(setTickets)
      .catch(() => setTickets([]))
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    loadTickets();
  }, []);

  async function onSubmit(values: FormValues) {
    await createTicket(values);
    reset();
    setShowForm(false);
    setIsLoading(true);
    loadTickets();
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">تذاكر الدعم الفني</h2>
        <Button size="sm" onClick={() => setShowForm((v) => !v)}>
          <Plus size={14} className="ml-1.5" /> تذكرة جديدة
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit(onSubmit)} className="card-surface mb-6 space-y-3 p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              {...register('subject', { required: true })}
              placeholder="موضوع المشكلة"
              className="rounded-xl border border-ink-border bg-ink-soft px-4 py-2.5 text-sm text-white placeholder:text-muted focus:border-siraj-500 focus:outline-none"
            />
            <select
              {...register('category')}
              defaultValue="GENERAL"
              className="rounded-xl border border-ink-border bg-ink-soft px-4 py-2.5 text-sm text-white focus:border-siraj-500 focus:outline-none"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <textarea
            {...register('message', { required: true })}
            rows={4}
            placeholder="اشرح المشكلة بالتفصيل..."
            className="w-full rounded-xl border border-ink-border bg-ink-soft px-4 py-2.5 text-sm text-white placeholder:text-muted focus:border-siraj-500 focus:outline-none"
          />
          <div className="flex justify-end">
            <Button type="submit" size="sm" isLoading={isSubmitting}>
              إرسال التذكرة
            </Button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card-surface h-16 animate-pulse" />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <div className="card-surface flex flex-col items-center gap-3 p-12 text-center">
          <LifeBuoy size={40} className="text-siraj-500" />
          <p className="text-muted">لسه معملتش أي تذكرة دعم — احنا هنا لو احتجت مساعدة</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tickets.map((ticket) => {
            const status = STATUS_LABELS[ticket.status];
            return (
              <Link
                key={ticket.id}
                href={`/${locale}/student/support/${ticket.id}`}
                className="card-surface flex items-center gap-4 p-4 transition hover:border-siraj-700/60"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-ink-soft text-siraj-400">
                  <MessageSquare size={16} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-white">{ticket.subject}</p>
                  <p className="text-xs text-muted">
                    {ticket._count.messages} رسالة — آخر تحديث {formatDate(ticket.updatedAt)}
                  </p>
                </div>
                <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', status.className)}>
                  {status.label}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
