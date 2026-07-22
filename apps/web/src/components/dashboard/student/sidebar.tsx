'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  BookOpen,
  TrendingUp,
  Award,
  ClipboardList,
  Bell,
  Heart,
  Download,
  User,
  LogOut,
  StickyNote,
  History,
  Trophy,
  CalendarDays,
  LifeBuoy,
  Receipt,
  Shield,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { clearSession } from '@/lib/api/auth';

export function StudentSidebar({ locale }: { locale: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Mobile Optimizations: close the drawer automatically on navigation
  // instead of leaving it open over the new page.
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const links = [
    { href: `/${locale}/student/dashboard`, label: 'الرئيسية', icon: LayoutDashboard },
    { href: `/${locale}/student/my-courses`, label: 'كورساتي', icon: BookOpen },
    { href: `/${locale}/student/progress`, label: 'تقدّمي', icon: TrendingUp },
    { href: `/${locale}/student/certificates`, label: 'شهاداتي', icon: Award },
    { href: `/${locale}/student/assignments`, label: 'الواجبات', icon: ClipboardList },
    { href: `/${locale}/student/planner`, label: 'التقويم الدراسي', icon: CalendarDays },
    { href: `/${locale}/student/notes`, label: 'ملاحظاتي', icon: StickyNote },
    { href: `/${locale}/student/watch-history`, label: 'سجل المشاهدة', icon: History },
    { href: `/${locale}/student/achievements`, label: 'إنجازاتي', icon: Trophy },
    { href: `/${locale}/student/wishlist`, label: 'المفضلة', icon: Heart },
    { href: `/${locale}/student/support`, label: 'الدعم الفني', icon: LifeBuoy },
    { href: `/${locale}/student/orders`, label: 'فواتيري', icon: Receipt },
    { href: `/${locale}/student/security`, label: 'الأمان', icon: Shield },
    { href: `/${locale}/student/downloads`, label: 'التنزيلات', icon: Download },
    { href: `/${locale}/student/notifications`, label: 'الإشعارات', icon: Bell },
    { href: `/${locale}/student/profile`, label: 'حسابي', icon: User },
  ];

  function handleLogout() {
    clearSession();
    router.push(`/${locale}/login`);
  }

  const navContent = (
    <>
      <div className="flex h-16 items-center justify-between px-6">
        <Link href={`/${locale}`} className="font-display text-xl font-extrabold text-siraj-500">
          سراج
        </Link>
        <button
          onClick={() => setIsMobileOpen(false)}
          className="text-muted-light hover:text-white lg:hidden"
          aria-label="إغلاق القائمة"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="التنقل الرئيسي">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive ? 'page' : undefined}
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
    </>
  );

  return (
    <>
      {/* Mobile Optimizations: hamburger trigger, only shown below lg */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="fixed top-4 z-40 flex h-10 w-10 items-center justify-center rounded-xl bg-ink-soft text-white shadow-lg ltr:left-4 rtl:right-4 lg:hidden"
        aria-label="فتح القائمة"
      >
        <Menu size={20} />
      </button>

      {/* Desktop: static sidebar, always visible at lg+ */}
      <aside className="hidden h-screen w-64 shrink-0 flex-col border-ink-border bg-ink-soft ltr:border-r rtl:border-l lg:flex">
        {navContent}
      </aside>

      {/* Mobile/Tablet: slide-over drawer + backdrop, only below lg */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setIsMobileOpen(false)}
            aria-hidden="true"
          />
          <aside className="absolute top-0 flex h-full w-72 flex-col bg-ink-soft ltr:left-0 rtl:right-0">
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
}
