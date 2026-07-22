'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, PlayCircle, FileText } from 'lucide-react';
import {
  fetchCourseForEdit,
  createChapter,
  createLesson,
  deleteChapter,
  deleteLesson,
} from '@/lib/api/teacher';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { VideoUploader } from './video-uploader';

export function CourseContentManager({ courseId }: { courseId: string }) {
  const [course, setCourse] = useState<any>(null);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [expandedChapterId, setExpandedChapterId] = useState<string | null>(null);
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonVideoUrl, setNewLessonVideoUrl] = useState('');

  useEffect(() => {
    refresh();
  }, [courseId]);

  async function refresh() {
    const data = await fetchCourseForEdit(courseId);
    setCourse(data);
  }

  async function handleAddChapter() {
    if (!newChapterTitle.trim()) return;
    await createChapter(courseId, newChapterTitle);
    setNewChapterTitle('');
    refresh();
  }

  async function handleAddLesson(chapterId: string) {
    if (!newLessonTitle.trim() || !newLessonVideoUrl) return;
    await createLesson(chapterId, {
      titleAr: newLessonTitle,
      type: 'VIDEO',
      videoUrl: newLessonVideoUrl,
    });
    setNewLessonTitle('');
    setNewLessonVideoUrl('');
    refresh();
  }

  async function handleDeleteChapter(chapterId: string) {
    await deleteChapter(chapterId, courseId);
    refresh();
  }

  async function handleDeleteLesson(lessonId: string) {
    await deleteLesson(lessonId);
    refresh();
  }

  if (!course) {
    return <div className="card-surface h-64 animate-pulse" />;
  }

  return (
    <div className="space-y-4">
      {/* Add new chapter */}
      <div className="card-surface flex gap-3 p-4">
        <Input
          placeholder="عنوان الفصل الجديد"
          value={newChapterTitle}
          onChange={(e) => setNewChapterTitle(e.target.value)}
        />
        <Button onClick={handleAddChapter}>
          <Plus size={16} /> إضافة فصل
        </Button>
      </div>

      {course.chapters?.map((chapter: any, idx: number) => {
        const isExpanded = expandedChapterId === chapter.id;
        return (
          <div key={chapter.id} className="card-surface overflow-hidden">
            <button
              onClick={() => setExpandedChapterId(isExpanded ? null : chapter.id)}
              className="flex w-full items-center justify-between bg-ink-soft px-5 py-3"
            >
              <span className="font-semibold text-white">
                {idx + 1}. {chapter.titleAr}
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteChapter(chapter.id);
                  }}
                  className="text-muted hover:text-danger"
                >
                  <Trash2 size={15} />
                </button>
                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </button>

            {isExpanded && (
              <div className="p-4">
                <ul className="mb-4 space-y-2">
                  {chapter.lessons.map((lesson: any) => (
                    <li
                      key={lesson.id}
                      className="flex items-center justify-between rounded-lg bg-ink-soft px-4 py-2.5 text-sm"
                    >
                      <span className="flex items-center gap-2 text-muted-light">
                        {lesson.type === 'PDF' ? <FileText size={14} /> : <PlayCircle size={14} />}
                        {lesson.titleAr}
                      </span>
                      <button
                        onClick={() => handleDeleteLesson(lesson.id)}
                        className="text-muted hover:text-danger"
                      >
                        <Trash2 size={14} />
                      </button>
                    </li>
                  ))}
                </ul>

                <div className="space-y-3 border-t border-ink-border pt-4">
                  <Input
                    placeholder="عنوان الدرس الجديد"
                    value={newLessonTitle}
                    onChange={(e) => setNewLessonTitle(e.target.value)}
                  />
                  <VideoUploader folder="course-videos" onUploaded={setNewLessonVideoUrl} />
                  <Button
                    onClick={() => handleAddLesson(chapter.id)}
                    disabled={!newLessonVideoUrl || !newLessonTitle}
                    className="w-full"
                  >
                    <Plus size={16} /> إضافة الدرس للفصل
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
