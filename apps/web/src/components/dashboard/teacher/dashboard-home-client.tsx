'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Users, Star, Wallet, ClipboardCheck, TrendingUp, Trophy } from 'lucide-react';
import { fetchMyTeachingCourses } from '@/lib/api/teacher';
import { fetchDashboardWidgets, type DashboardWidgets } from '@/lib/api/teacher-analytics';

function StatCard({ icon: Icon, label, value }: { icon: typeof BookOpen; label: string; value: string | number }) {
  return (
    <div className="card-surface flex items-center gap-4 p-5">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-siraj-900/40 text-siraj-400">
        <Icon size={20} />
      </div>
      <div>
        <p className="font-display text-xl font-extrabold text-white">{value}</p>
        <p className="text-xs text-muted">{label}</p>
      </div>
    </div>
  );
}

export function TeacherDashboardHomeClient({ locale }: { locale: string }) {
  const [courses, setCourses] = useState<any[]>([]);
  const [widgets, setWidgets] = useState<DashboardWidgets | null>(null);

  useEffect(() => {
    fetchMyTeachingCourses().then(setCourses);
    fetchDashboardWidgets()
      .then(setWidgets)
      .catch(() => setWidgets(null));
  }, []);

  const totalStudents = courses.reduce((sum, c) => sum + c.totalStudents, 0);
  const avgRating =
    courses.length > 0
      ? courses.reduce((sum, c) => sum + Number(c.averageRating), 0) / courses.length
      : 0;
  const publishedCount = courses.filter((c) => c.status === 'PUBLISHED').length;

  return (
    <div className="p-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={BookOpen} label="كورسات منشورة" value={publishedCount} />
        <StatCard icon={Users} label="إجمالي الطلاب" value={totalStudents} />
        <StatCard icon={Star} label="متوسط التقييم" value={avgRating.toFixed(1)} />
        <Link href={`/${locale}/teacher/earnings`}>
          <StatCard
            icon={Wallet}
            label="إيرادات الشهر ده"
            value={widgets ? widgets.revenueThisMonth.toFixed(0) : '—'}
          />
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={TrendingUp}
          label="طلاب جدد هذا الأسبوع"
          value={widgets?.newStudentsThisWeek ?? '—'}
        />
        <StatCard
          icon={Trophy}
          label="متوسط نسبة الإتمام"
          value={widgets ? `${widgets.averageCompletionRatePct.toFixed(0)}%` : '—'}
        />
        <Link href={`/${locale}/teacher/courses`}>
          <StatCard
            icon={ClipboardCheck}
            label="واجبات بانتظار التصحيح"
            value={widgets?.pendingAssignmentReviews ?? '—'}
          />
        </Link>
        <StatCard
          icon={ClipboardCheck}
          label="امتحانات مقالية بانتظار التصحيح"
          value={widgets?.pendingExamReviews ?? '—'}
        />
      </div>

      {widgets?.topCourse && (
        <div className="card-surface mt-6 flex items-center gap-4 p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
            <Trophy size={20} />
          </div>
          <div>
            <p className="text-sm font-bold text-white">أفضل كورس أداءً: {widgets.topCourse.courseTitle}</p>
            <p className="text-xs text-muted">
              {widgets.topCourse.enrollmentCount} طالب — {widgets.topCourse.completionRatePct.toFixed(0)}% نسبة إتمام
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
