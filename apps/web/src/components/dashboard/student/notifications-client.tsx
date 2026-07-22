'use client';

import { useEffect, useState } from 'react';
import { Bell, BellOff, Check } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { cn } from '@/lib/utils';

interface AppNotification {
  id: string;
  type: string;
  titleAr: string;
  bodyAr: string;
  isRead: boolean;
  createdAt: string;
}

export function NotificationsClient() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get('/notifications')
      .then((res) => setNotifications(res.data.data.items))
      .catch(() => setNotifications([]))
      .finally(() => setIsLoading(false));
  }, []);

  async function markAsRead(id: string) {
    await apiClient.patch(`/notifications/${id}/read`);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
  }

  async function markAllAsRead() {
    await apiClient.patch('/notifications/read-all');
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }

  if (isLoading) {
    return (
      <div className="space-y-3 p-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card-surface h-20 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6">
      {notifications.length > 0 && (
        <div className="mb-4 flex justify-end">
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-1.5 text-sm text-siraj-400 hover:underline"
          >
            <Check size={14} /> تعليم الكل كمقروء
          </button>
        </div>
      )}

      {notifications.length === 0 ? (
        <div className="card-surface flex flex-col items-center gap-3 p-12 text-center">
          <BellOff size={40} className="text-muted" />
          <p className="text-muted">لا توجد إشعارات حاليًا</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => !n.isRead && markAsRead(n.id)}
              className={cn(
                'flex w-full items-start gap-3 rounded-xl border p-4 text-right transition',
                n.isRead
                  ? 'border-ink-border bg-ink-card'
                  : 'border-siraj-700/50 bg-siraj-900/10',
              )}
            >
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-siraj-900/40 text-siraj-400">
                <Bell size={15} />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-semibold text-white">{n.titleAr}</span>
                <span className="block text-xs text-muted">{n.bodyAr}</span>
              </span>
              {!n.isRead && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-siraj-500" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
