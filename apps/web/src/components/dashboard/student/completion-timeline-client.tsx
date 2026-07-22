'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Circle, ListChecks } from 'lucide-react';
import { fetchCourseCompletionTimeline, type TimelineChapter } from '@/lib/api/completion-timeline';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function CompletionTimelineClient({ courseId }: { courseId: string }) {
  const [chapters, setChapters] = useState<TimelineChapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCourseCompletionTimeline(courseId)
      .then(setChapters)
      .catch(() => setChapters([]))
      .finally(() => setIsLoading(false));
  }, [courseId]);

  if (isLoading) {
    return (
      <div className="space-y-3 p-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card-surface h-16 animate-pulse" />
        ))}
      </div>
    );
  }

  const totalLessons = chapters.reduce((sum, c) => sum + c.lessons.length, 0);
  const completedLessons = chapters.reduce(
    (sum, c) => sum + c.lessons.filter((l) => l.isCompleted).length,
    0,
  );

  return (
    <div className="p-6">
      <div className="card-surface mb-6 flex items-center gap-4 p-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-siraj-900/40 text-siraj-400">
          <ListChecks size={22} />
        </div>
        <div>
          <p className="font-display text-xl font-extrabold text-white">
            {completedLessons} / {totalLessons}
          </p>
          <p className="text-xs text-muted">درس مكتمل</p>
        </div>
      </div>

      <div className="relative space-y-8 ltr:pl-6 rtl:pr-6">
        <div className="absolute top-1 bottom-1 w-px bg-ink-border ltr:left-2 rtl:right-2" />
        {chapters.map((chapter) => (
          <div key={chapter.chapterId}>
            <h3 className="mb-3 text-sm font-bold text-siraj-400">{chapter.chapterTitle}</h3>
            <div className="space-y-2">
              {chapter.lessons.map((lesson) => (
                <div key={lesson.lessonId} className="relative flex items-center gap-3">
                  <span
                    className={`absolute flex h-4 w-4 items-center justify-center rounded-full ltr:-left-6 rtl:-right-6 ${
                      lesson.isCompleted ? 'bg-siraj-500' : 'bg-ink-border'
                    }`}
                  />
                  <div className="card-surface flex flex-1 items-center gap-3 p-3">
                    {lesson.isCompleted ? (
                      <CheckCircle2 size={16} className="text-success" />
                    ) : (
                      <Circle size={16} className="text-muted" />
                    )}
                    <span
                      className={`flex-1 text-sm ${
                        lesson.isCompleted ? 'text-white' : 'text-muted'
                      }`}
                    >
                      {lesson.titleAr}
                    </span>
                    {lesson.completedAt && (
                      <span className="text-xs text-muted">{formatDate(lesson.completedAt)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
