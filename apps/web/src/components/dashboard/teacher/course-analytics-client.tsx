'use client';

import { useEffect, useState } from 'react';
import { Users, CheckCircle2, TrendingUp, BarChart3 } from 'lucide-react';
import { fetchCourseAnalytics, type CourseAnalytics } from '@/lib/api/course-analytics';
import { ProgressBar } from '@/components/ui/progress-bar';

export function CourseAnalyticsClient({ courseId }: { courseId: string }) {
  const [analytics, setAnalytics] = useState<CourseAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCourseAnalytics(courseId)
      .then(setAnalytics)
      .catch(() => setAnalytics(null))
      .finally(() => setIsLoading(false));
  }, [courseId]);

  if (isLoading) {
    return (
      <div className="space-y-3 p-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card-surface h-20 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!analytics) {
    return <div className="p-6 text-center text-muted">تعذّر تحميل الإحصائيات</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card-surface flex items-center gap-4 p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-siraj-900/40 text-siraj-400">
            <Users size={22} />
          </div>
          <div>
            <p className="font-display text-xl font-extrabold text-white">
              {analytics.totalEnrollments}
            </p>
            <p className="text-xs text-muted">إجمالي المشتركين</p>
          </div>
        </div>
        <div className="card-surface flex items-center gap-4 p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-500/10 text-green-400">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <p className="font-display text-xl font-extrabold text-white">
              {analytics.completionRatePct.toFixed(0)}%
            </p>
            <p className="text-xs text-muted">نسبة إتمام الكورس ({analytics.completedCount} طالب)</p>
          </div>
        </div>
        <div className="card-surface flex items-center gap-4 p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
            <TrendingUp size={22} />
          </div>
          <div>
            <p className="font-display text-xl font-extrabold text-white">
              {analytics.averageProgressPct.toFixed(0)}%
            </p>
            <p className="text-xs text-muted">متوسط التقدم لكل الطلاب</p>
          </div>
        </div>
      </div>

      <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
        <BarChart3 size={18} className="text-siraj-400" /> نسبة الإتمام لكل درس (لتحديد نقاط التسرب)
      </h2>
      <div className="space-y-3">
        {analytics.lessonBreakdown.map((lesson) => (
          <div key={lesson.lessonId} className="card-surface p-4">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-white">{lesson.titleAr}</p>
                <p className="text-xs text-muted">{lesson.chapterTitle}</p>
              </div>
              <span className="text-sm font-bold text-siraj-400">
                {lesson.completionRatePct.toFixed(0)}%
              </span>
            </div>
            <ProgressBar value={lesson.completionRatePct} />
          </div>
        ))}
      </div>
    </div>
  );
}
