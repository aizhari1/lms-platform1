'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { FileText, Megaphone, MessagesSquare, FolderDown } from 'lucide-react';
import {
  fetchCourseProgress,
  fetchLessonToWatch,
} from '@/lib/api/learn';
import { CurriculumSidebar } from './curriculum-sidebar';
import { LessonComments } from './lesson-comments';
import { LessonNotesBookmarks } from './lesson-notes-bookmarks';
import { CourseAnnouncementsPanel } from './course-announcements-panel';
import { CourseDiscussionPanel } from './course-discussion-panel';
import { CourseResourcesPanel } from './course-resources-panel';
import { CourseAssignmentsPanel } from './course-assignments-panel';
import { VideoChaptersPanel } from './video-chapters-panel';
import { TranscriptPanel } from './transcript-panel';

// Lazy Loading: Plyr (~40kb) and its CSS only get downloaded once a
// student actually opens a video lesson, not on every page in the app
// that happens to render this component tree.
const VideoPlayer = dynamic(() => import('./video-player').then((m) => m.VideoPlayer), {
  ssr: false,
  loading: () => <div className="aspect-video w-full animate-pulse rounded-xl2 bg-ink-soft" />,
});

interface CoursePlayerProps {
  courseId: string;
  courseSlug: string;
  locale: string;
  lessonId: string;
  chapters: {
    id: string;
    titleAr: string;
    lessons: { id: string; titleAr: string; type: string }[];
  }[];
}

export function CoursePlayerClient({
  courseId,
  courseSlug,
  locale,
  lessonId,
  chapters,
}: CoursePlayerProps) {
  const router = useRouter();
  const [lesson, setLesson] = useState<any>(null);
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoNextEnabled, setAutoNextEnabled] = useState(true);
  const [courseTab, setCourseTab] = useState<
    'discussion' | 'announcements' | 'resources' | 'assignments'
  >('discussion');

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    Promise.all([
      fetchLessonToWatch(lessonId),
      fetchCourseProgress(courseId),
    ])
      .then(([lessonData, progressData]) => {
        setLesson(lessonData);
        setCompletedLessonIds(
          new Set(
            progressData.lessons
              .filter((l: any) => l.isCompleted)
              .map((l: any) => l.lessonId),
          ),
        );
      })
      .catch(() => setError('لا يمكنك مشاهدة هذا الدرس — تأكد من تسجيلك في الكورس'))
      .finally(() => setIsLoading(false));
  }, [lessonId, courseId]);

  function handleCompleted() {
    setCompletedLessonIds((prev) => new Set(prev).add(lessonId));
  }

  function handleEnded() {
    if (autoNextEnabled && lesson?.nextLessonId) {
      router.push(`/${locale}/course/${courseSlug}/learn/${lesson.nextLessonId}`);
    }
  }

  return (
    <div className="flex h-screen flex-col-reverse lg:flex-row-reverse">
      <CurriculumSidebar
        chapters={chapters}
        activeLessonId={lessonId}
        courseSlug={courseSlug}
        locale={locale}
        completedLessonIds={completedLessonIds}
      />

      <main className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="aspect-video w-full animate-pulse rounded-xl2 bg-ink-card" />
        ) : error ? (
          <div className="card-surface p-10 text-center text-danger">{error}</div>
        ) : (
          <>
            <h1 className="mb-4 text-lg font-bold text-white">{lesson.titleAr}</h1>

            {lesson.type === 'VIDEO' && lesson.videoUrl && (
              <>
                <VideoPlayer
                  lessonId={lessonId}
                  videoUrl={lesson.videoUrl}
                  initialPositionSec={lesson.lastPositionSec}
                  subtitlesUrl={lesson.subtitlesUrl}
                  watermarkText={lesson.watermarkText}
                  onCompleted={handleCompleted}
                  onEnded={handleEnded}
                />

                <div className="mt-3 flex items-center justify-end gap-2">
                  <label className="flex items-center gap-2 text-xs text-muted-light">
                    <input
                      type="checkbox"
                      checked={autoNextEnabled}
                      onChange={(e) => setAutoNextEnabled(e.target.checked)}
                      className="accent-siraj-500"
                    />
                    تشغيل الدرس التالي تلقائيًا
                  </label>
                </div>

                {lesson.videoChapters?.length > 0 && (
                  <VideoChaptersPanel chapters={lesson.videoChapters} />
                )}
                {lesson.transcriptAr && <TranscriptPanel transcript={lesson.transcriptAr} />}
              </>
            )}

            {lesson.type === 'PDF' && lesson.pdfUrl && (
              <a
                href={lesson.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="card-surface flex items-center justify-center gap-3 p-10 text-siraj-400 hover:border-siraj-500"
              >
                <FileText size={24} /> فتح ملف PDF
              </a>
            )}

            {lesson.type === 'ARTICLE' && lesson.articleContent && (
              <div className="card-surface prose prose-invert p-6 text-muted-light">
                {lesson.articleContent}
              </div>
            )}

            {lesson.type === 'VIDEO' && lesson.videoUrl && (
              <LessonNotesBookmarks lessonId={lessonId} />
            )}

            <LessonComments lessonId={lessonId} />

            <div className="mt-8 border-t border-ink-border pt-6">
              <div className="mb-4 flex items-center gap-2 border-b border-ink-border">
                <button
                  onClick={() => setCourseTab('discussion')}
                  className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-bold transition ${
                    courseTab === 'discussion'
                      ? 'border-siraj-500 text-white'
                      : 'border-transparent text-muted-light hover:text-white'
                  }`}
                >
                  <MessagesSquare size={16} /> نقاش الكورس
                </button>
                <button
                  onClick={() => setCourseTab('announcements')}
                  className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-bold transition ${
                    courseTab === 'announcements'
                      ? 'border-siraj-500 text-white'
                      : 'border-transparent text-muted-light hover:text-white'
                  }`}
                >
                  <Megaphone size={16} /> الإعلانات
                </button>
                <button
                  onClick={() => setCourseTab('resources')}
                  className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-bold transition ${
                    courseTab === 'resources'
                      ? 'border-siraj-500 text-white'
                      : 'border-transparent text-muted-light hover:text-white'
                  }`}
                >
                  <FolderDown size={16} /> الملفات
                </button>
                <button
                  onClick={() => setCourseTab('assignments')}
                  className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-bold transition ${
                    courseTab === 'assignments'
                      ? 'border-siraj-500 text-white'
                      : 'border-transparent text-muted-light hover:text-white'
                  }`}
                >
                  <FileText size={16} /> الواجبات
                </button>
              </div>

              {courseTab === 'discussion' && <CourseDiscussionPanel courseId={courseId} />}
              {courseTab === 'announcements' && <CourseAnnouncementsPanel courseId={courseId} />}
              {courseTab === 'resources' && <CourseResourcesPanel courseId={courseId} />}
              {courseTab === 'assignments' && <CourseAssignmentsPanel courseId={courseId} />}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
