'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  FolderTree,
  Ticket,
  BarChart3,
  Settings,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { clearSession } from '@/lib/api/auth';

export function AdminSidebar({ locale }: { locale: string }) {
  const pathname = usePathname();
  const router = useRouter();

  const links = [
    { href: `/${locale}/admin/dashboard`, label: 'الرئيسية', icon: LayoutDashboard },
    { href: `/${locale}/admin/courses`, label: 'مراجعة الكورسات', icon: ShieldCheck },
    { href: `/${locale}/admin/users`, label: 'المستخدمون', icon: Users },
    { href: `/${locale}/admin/categories`, label: 'التصنيفات', icon: FolderTree },
    { href: `/${locale}/admin/coupons`, label: 'الكوبونات', icon: Ticket },
    { href: `/${locale}/admin/reports`, label: 'التقارير', icon: BarChart3 },
    { href: `/${locale}/admin/settings`, label: 'الإعدادات', icon: Settings },
  ];

  function handleLogout() {
    clearSession();
    router.push(`/${locale}/login`);
  }

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-ink-border bg-ink-soft ltr:border-r rtl:border-l">
      <div className="flex h-16 items-center px-6">
        <Link href={`/${locale}`} className="font-display text-xl font-extrabold text-siraj-500">
          سراج <span className="text-xs text-muted">أدمن</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition',
                isActive
                  ? 'bg-siraj-500 text-white'
                  : 'text-muted-light hover:bg-ink-card hover:text-white',
              )}
            >
              <link.icon size={18} />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-ink-border p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-muted-light transition hover:bg-ink-card hover:text-danger"
        >
          <LogOut size={18} />
          تسجيل الخروج
        </button>
      </div>
    </aside>
  );
}
