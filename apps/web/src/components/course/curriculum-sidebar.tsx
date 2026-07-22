'use client';

import Link from 'next/link';
import { CheckCircle2, Circle, FileText, PlayCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LessonItem {
  id: string;
  titleAr: string;
  type: string;
  isCompleted?: boolean;
}

interface ChapterItem {
  id: string;
  titleAr: string;
  lessons: LessonItem[];
}

export function CurriculumSidebar({
  chapters,
  activeLessonId,
  courseSlug,
  locale,
  completedLessonIds,
}: {
  chapters: ChapterItem[];
  activeLessonId: string;
  courseSlug: string;
  locale: string;
  completedLessonIds: Set<string>;
}) {
  return (
    <aside className="h-full w-80 shrink-0 overflow-y-auto border-ink-border bg-ink-soft ltr:border-l rtl:border-r">
      <div className="border-b border-ink-border p-4">
        <h2 className="text-sm font-bold text-white">محتوى الكورس</h2>
      </div>

      {chapters.map((chapter, idx) => (
        <div key={chapter.id} className="border-b border-ink-border/50">
          <div className="bg-ink px-4 py-2.5 text-xs font-semibold text-muted">
            {idx + 1}. {chapter.titleAr}
          </div>
          <ul>
            {chapter.lessons.map((lesson) => {
              const isActive = lesson.id === activeLessonId;
              const isCompleted = completedLessonIds.has(lesson.id);

              return (
                <li key={lesson.id}>
                  <Link
                    href={`/${locale}/course/${courseSlug}/learn/${lesson.id}`}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 text-sm transition',
                      isActive
                        ? 'bg-siraj-900/30 text-siraj-400'
                        : 'text-muted-light hover:bg-ink-card hover:text-white',
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle2 size={16} className="shrink-0 text-success" />
                    ) : (
                      <Circle size={16} className="shrink-0 text-muted" />
                    )}
                    {lesson.type === 'PDF' ? (
                      <FileText size={14} className="shrink-0" />
                    ) : (
                      <PlayCircle size={14} className="shrink-0" />
                    )}
                    <span className="line-clamp-1">{lesson.titleAr}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </aside>
  );
}
