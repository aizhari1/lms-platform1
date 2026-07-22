'use client';

import { useEffect, useState } from 'react';
import {
  TrendingUp,
  Users,
  Activity,
  BarChart3,
  Download,
  DollarSign,
} from 'lucide-react';
import {
  fetchRevenueAnalytics,
  fetchStudentAnalytics,
  fetchRetentionAnalytics,
  fetchCoursePerformance,
  exportStudentsReport,
  exportRevenueReport,
  type RevenueAnalytics,
  type StudentAnalytics,
  type RetentionAnalytics,
  type CoursePerformanceRow,
} from '@/lib/api/teacher-analytics';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Button } from '@/components/ui/button';

function StatCard({ icon: Icon, label, value }: { icon: typeof TrendingUp; label: string; value: string | number }) {
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

export function TeacherAnalyticsClient() {
  const [tab, setTab] = useState<'revenue' | 'students' | 'retention' | 'performance'>('revenue');
  const [revenue, setRevenue] = useState<RevenueAnalytics | null>(null);
  const [students, setStudents] = useState<StudentAnalytics | null>(null);
  const [retention, setRetention] = useState<RetentionAnalytics | null>(null);
  const [performance, setPerformance] = useState<CoursePerformanceRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchRevenueAnalytics().catch(() => null),
      fetchStudentAnalytics().catch(() => null),
      fetchRetentionAnalytics().catch(() => null),
      fetchCoursePerformance().catch(() => []),
    ]).then(([r, s, ret, perf]) => {
      setRevenue(r);
      setStudents(s);
      setRetention(ret);
      setPerformance(perf);
      setIsLoading(false);
    });
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

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between border-b border-ink-border">
        <div className="flex items-center gap-2">
          {[
            { key: 'revenue', label: 'الإيرادات', icon: DollarSign },
            { key: 'students', label: 'الطلاب', icon: Users },
            { key: 'retention', label: 'الاحتفاظ بالطلاب', icon: Activity },
            { key: 'performance', label: 'أداء الكورسات', icon: BarChart3 },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as any)}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-bold transition ${
                tab === t.key
                  ? 'border-siraj-500 text-white'
                  : 'border-transparent text-muted-light hover:text-white'
              }`}
            >
              <t.icon size={16} /> {t.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 pb-2">
          <Button size="sm" variant="outline" onClick={exportStudentsReport}>
            <Download size={13} className="ml-1.5" /> تصدير الطلاب
          </Button>
          <Button size="sm" variant="outline" onClick={exportRevenueReport}>
            <Download size={13} className="ml-1.5" /> تصدير الإيرادات
          </Button>
        </div>
      </div>

      {tab === 'revenue' && revenue && (
        <div>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <StatCard icon={DollarSign} label="إجمالي الإيرادات" value={revenue.totalRevenue.toFixed(2)} />
            <StatCard icon={TrendingUp} label="عدد الكورسات المربحة" value={revenue.byCourse.length} />
          </div>
          <h3 className="mb-3 text-sm font-bold text-white">الإيرادات حسب الكورس</h3>
          <div className="space-y-2">
            {revenue.byCourse.map((c) => (
              <div key={c.courseTitle} className="card-surface flex items-center justify-between p-4">
                <span className="text-sm text-white">{c.courseTitle}</span>
                <span className="text-sm font-bold text-siraj-400">{c.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'students' && students && (
        <div>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <StatCard icon={Users} label="إجمالي الطلاب" value={students.totalUniqueStudents} />
            <StatCard icon={TrendingUp} label="إجمالي التسجيلات" value={students.totalEnrollments} />
          </div>
          <h3 className="mb-3 text-sm font-bold text-white">الطلاب حسب الكورس</h3>
          <div className="space-y-2">
            {students.perCourse.map((c) => (
              <div key={c.courseId} className="card-surface flex items-center justify-between p-4">
                <span className="text-sm text-white">{c.courseTitle}</span>
                <span className="text-sm font-bold text-siraj-400">{c.studentCount} طالب</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'retention' && retention && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard icon={Activity} label="نسبة الاحتفاظ" value={`${retention.retentionRatePct.toFixed(0)}%`} />
          <StatCard icon={Users} label="طلاب نشطون (آخر 30 يوم)" value={retention.activeStudents} />
          <StatCard icon={Users} label="طلاب غير نشطين" value={retention.inactiveStudents} />
        </div>
      )}

      {tab === 'performance' && (
        <div className="space-y-3">
          {performance.map((course) => (
            <div key={course.courseId} className="card-surface p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-bold text-white">{course.courseTitle}</p>
                <span className="text-xs text-muted">
                  {course.enrollmentCount} طالب — ⭐ {Number(course.averageRating).toFixed(1)}
                </span>
              </div>
              <ProgressBar value={course.completionRatePct} />
              <p className="mt-1 text-xs text-siraj-400">
                {course.completionRatePct.toFixed(0)}% نسبة إتمام الكورس
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
