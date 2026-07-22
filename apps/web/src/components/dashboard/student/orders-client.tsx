'use client';

import { useEffect, useState } from 'react';
import {
  Receipt,
  Download,
  ChevronDown,
  RotateCcw,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import {
  fetchMyOrders,
  fetchOrderTimeline,
  requestRefund,
  type MyOrder,
  type OrderTimelineEvent,
} from '@/lib/api/orders';
import { Button } from '@/components/ui/button';

const STATUS_CONFIG: Record<MyOrder['status'], { label: string; className: string }> = {
  PENDING: { label: 'قيد الانتظار', className: 'bg-siraj-900/40 text-siraj-400' },
  PAID: { label: 'مدفوع', className: 'bg-green-500/10 text-green-400' },
  FAILED: { label: 'فشلت', className: 'bg-danger/10 text-danger' },
  REFUNDED: { label: 'مسترد', className: 'bg-ink-soft text-muted' },
  CANCELLED: { label: 'ملغي', className: 'bg-ink-soft text-muted' },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' });
}

function OrderRow({ order }: { order: MyOrder }) {
  const [expanded, setExpanded] = useState(false);
  const [timeline, setTimeline] = useState<OrderTimelineEvent[]>([]);
  const [showRefundForm, setShowRefundForm] = useState(false);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refundSent, setRefundSent] = useState(false);

  async function toggleExpand() {
    if (!expanded) {
      const data = await fetchOrderTimeline(order.id);
      setTimeline(data);
    }
    setExpanded((v) => !v);
  }

  async function handleRefundSubmit() {
    if (!reason.trim()) return;
    setIsSubmitting(true);
    try {
      await requestRefund(order.id, reason);
      setRefundSent(true);
      setShowRefundForm(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="card-surface p-4">
      <div className="flex items-center gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-siraj-900/40 text-siraj-400">
          <Receipt size={18} />
        </span>
        <div className="flex-1">
          <p className="text-sm font-bold text-white">طلب رقم {order.orderNo.slice(-8)}</p>
          <p className="text-xs text-muted">{formatDate(order.createdAt)}</p>
        </div>
        <span className="font-display text-sm font-extrabold text-white">
          {order.totalAmount} {order.currency}
        </span>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_CONFIG[order.status].className}`}
        >
          {STATUS_CONFIG[order.status].label}
        </span>
        <button onClick={toggleExpand} className="text-muted hover:text-white">
          <ChevronDown size={18} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {expanded && (
        <div className="mt-4 space-y-4 border-t border-ink-border pt-4">
          <div className="flex flex-wrap items-center gap-3">
            {order.invoiceUrl && (
              <a
                href={order.invoiceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg bg-siraj-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-siraj-400"
              >
                <Download size={12} /> تحميل الفاتورة
              </a>
            )}
            {order.status === 'PAID' && !refundSent && (
              <Button size="sm" variant="outline" onClick={() => setShowRefundForm((v) => !v)}>
                <RotateCcw size={12} className="ml-1.5" /> طلب استرداد
              </Button>
            )}
            {refundSent && (
              <span className="text-xs font-semibold text-amber-400">تم إرسال طلب الاسترداد ✓</span>
            )}
          </div>

          {showRefundForm && (
            <div className="flex gap-2">
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="سبب طلب الاسترداد..."
                className="flex-1 rounded-xl border border-ink-border bg-ink-soft px-4 py-2 text-sm text-white placeholder:text-muted focus:border-siraj-500 focus:outline-none"
              />
              <Button size="sm" onClick={handleRefundSubmit} isLoading={isSubmitting}>
                إرسال
              </Button>
            </div>
          )}

          <div>
            <h4 className="mb-2 text-xs font-bold text-muted">الجدول الزمني للطلب</h4>
            <div className="space-y-2">
              {timeline.map((event, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-muted-light">
                  <span className="h-1.5 w-1.5 rounded-full bg-siraj-400" />
                  {event.label} — {formatDate(event.date)}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function OrdersClient() {
  const [orders, setOrders] = useState<MyOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMyOrders()
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-3 p-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card-surface h-16 animate-pulse" />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="p-6">
        <div className="card-surface flex flex-col items-center gap-3 p-12 text-center">
          <Receipt size={40} className="text-siraj-500" />
          <p className="text-muted">لسه معملتش أي عملية شراء</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-6">
      {orders.map((order) => (
        <OrderRow key={order.id} order={order} />
      ))}
    </div>
  );
}
