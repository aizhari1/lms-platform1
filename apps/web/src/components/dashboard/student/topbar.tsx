'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { fetchUnreadNotificationsCount } from '@/lib/api/student';

export function DashboardTopbar({
  locale,
  title,
}: {
  locale: string;
  title: string;
}) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchUnreadNotificationsCount()
      .then(setUnreadCount)
      .catch(() => setUnreadCount(0));
  }, []);

  return (
    <header className="flex h-16 items-center justify-between border-b border-ink-border bg-ink-soft ps-16 pe-6 lg:px-6">
      <h1 className="truncate text-lg font-bold text-white">{title}</h1>

      <Link
        href={`/${locale}/student/notifications`}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl text-muted-light transition hover:bg-ink-card hover:text-siraj-400"
      >
        <Bell size={19} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 h-4 w-4 rounded-full bg-danger text-[10px] font-bold text-white ltr:right-1.5 rtl:left-1.5">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Link>
    </header>
  );
}
