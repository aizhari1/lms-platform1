'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Send } from 'lucide-react';
import { fetchTicket, replyToTicket, type TicketDetail } from '@/lib/api/support-tickets';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'مفتوحة',
  IN_PROGRESS: 'قيد المعالجة',
  RESOLVED: 'تم الحل',
  CLOSED: 'مغلقة',
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('ar-EG', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function TicketDetailClient({ ticketId }: { ticketId: string }) {
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<{ body: string }>();
  const bottomRef = useRef<HTMLDivElement>(null);

  function loadTicket() {
    fetchTicket(ticketId)
      .then(setTicket)
      .catch(() => setTicket(null))
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    loadTicket();
  }, [ticketId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticket?.messages.length]);

  async function onSubmit(values: { body: string }) {
    await replyToTicket(ticketId, values.body);
    reset();
    loadTicket();
  }

  if (isLoading) {
    return (
      <div className="space-y-3 p-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card-surface h-16 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!ticket) {
    return <div className="p-6 text-center text-muted">التذكرة غير موجودة</div>;
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col p-6">
      <div className="card-surface mb-4 flex items-center justify-between p-4">
        <div>
          <h2 className="text-sm font-bold text-white">{ticket.subject}</h2>
          <p className="text-xs text-muted">تذكرة رقم {ticket.id.slice(-8)}</p>
        </div>
        <span className="rounded-full bg-siraj-900/40 px-3 py-1 text-xs font-semibold text-siraj-400">
          {STATUS_LABELS[ticket.status]}
        </span>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto">
        {ticket.messages.map((message) => {
          const isMine = message.sender.id === ticket.student.id;
          return (
            <div
              key={message.id}
              className={cn('flex flex-col', isMine ? 'items-end' : 'items-start')}
            >
              <div
                className={cn(
                  'max-w-md rounded-2xl px-4 py-3 text-sm',
                  isMine ? 'bg-siraj-500 text-white' : 'bg-ink-card text-white',
                )}
              >
                {message.body}
              </div>
              <p className="mt-1 text-[11px] text-muted">
                {message.sender.fullName} — {formatDateTime(message.createdAt)}
              </p>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {ticket.status !== 'CLOSED' && (
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 flex gap-3">
          <input
            {...register('body', { required: true })}
            placeholder="اكتب ردك..."
            className="flex-1 rounded-xl border border-ink-border bg-ink-soft px-4 py-2.5 text-sm text-white placeholder:text-muted focus:border-siraj-500 focus:outline-none"
          />
          <Button type="submit" size="sm" isLoading={isSubmitting}>
            <Send size={14} className="ml-1.5" /> إرسال
          </Button>
        </form>
      )}
    </div>
  );
}
