'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { StickyNote, Bookmark as BookmarkIcon, Trash2, Play } from 'lucide-react';
import {
  fetchLessonNotes,
  createNote,
  deleteNote,
  fetchLessonBookmarks,
  createBookmark,
  deleteBookmark,
} from '@/lib/api/notes';
import { Button } from '@/components/ui/button';

interface NoteRow {
  id: string;
  content: string;
  timestampSec: number | null;
  createdAt: string;
}

interface BookmarkRow {
  id: string;
  timestampSec: number;
  label: string | null;
  createdAt: string;
}

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/** Reads the current playback position from the <video> element the Plyr player renders. */
function getCurrentVideoTime(): number {
  const video = document.querySelector('video');
  return video ? Math.floor(video.currentTime) : 0;
}

function seekVideoTo(seconds: number) {
  const video = document.querySelector('video');
  if (video) {
    video.currentTime = seconds;
    video.play().catch(() => {});
  }
}

export function LessonNotesBookmarks({ lessonId }: { lessonId: string }) {
  const [tab, setTab] = useState<'notes' | 'bookmarks'>('notes');
  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [bookmarks, setBookmarks] = useState<BookmarkRow[]>([]);
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<{ content: string }>();

  useEffect(() => {
    fetchLessonNotes(lessonId).then(setNotes);
    fetchLessonBookmarks(lessonId).then(setBookmarks);
  }, [lessonId]);

  async function onSubmitNote(values: { content: string }) {
    const timestampSec = getCurrentVideoTime();
    const note = await createNote({ lessonId, content: values.content, timestampSec });
    setNotes((prev) => [note, ...prev]);
    reset();
  }

  async function handleRemoveNote(noteId: string) {
    await deleteNote(noteId);
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
  }

  async function handleAddBookmark() {
    const timestampSec = getCurrentVideoTime();
    const bookmark = await createBookmark({
      lessonId,
      timestampSec,
      label: `عند ${formatTime(timestampSec)}`,
    });
    setBookmarks((prev) => [...prev, bookmark].sort((a, b) => a.timestampSec - b.timestampSec));
  }

  async function handleRemoveBookmark(bookmarkId: string) {
    await deleteBookmark(bookmarkId);
    setBookmarks((prev) => prev.filter((b) => b.id !== bookmarkId));
  }

  return (
    <div className="mt-6">
      <div className="mb-4 flex items-center gap-2 border-b border-ink-border">
        <button
          onClick={() => setTab('notes')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-bold transition ${
            tab === 'notes'
              ? 'border-siraj-500 text-white'
              : 'border-transparent text-muted-light hover:text-white'
          }`}
        >
          <StickyNote size={16} /> ملاحظاتي ({notes.length})
        </button>
        <button
          onClick={() => setTab('bookmarks')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-bold transition ${
            tab === 'bookmarks'
              ? 'border-siraj-500 text-white'
              : 'border-transparent text-muted-light hover:text-white'
          }`}
        >
          <BookmarkIcon size={16} /> العلامات المرجعية ({bookmarks.length})
        </button>
      </div>

      {tab === 'notes' && (
        <div>
          <form onSubmit={handleSubmit(onSubmitNote)} className="mb-6 flex gap-3">
            <input
              {...register('content', { required: true })}
              placeholder="اكتب ملاحظة عند اللحظة الحالية من الفيديو..."
              className="flex-1 rounded-xl border border-ink-border bg-ink-soft px-4 py-2.5 text-sm text-white placeholder:text-muted focus:border-siraj-500 focus:outline-none"
            />
            <Button type="submit" size="sm" isLoading={isSubmitting}>
              إضافة
            </Button>
          </form>

          {notes.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-light">
              لسه معملتش أي ملاحظات على الدرس ده
            </p>
          ) : (
            <div className="space-y-3">
              {notes.map((note) => (
                <div key={note.id} className="card-surface flex items-start justify-between gap-3 p-4">
                  <div className="flex-1">
                    {note.timestampSec !== null && (
                      <button
                        onClick={() => seekVideoTo(note.timestampSec!)}
                        className="mb-1 flex items-center gap-1 text-xs font-semibold text-siraj-400 hover:underline"
                      >
                        <Play size={12} /> {formatTime(note.timestampSec)}
                      </button>
                    )}
                    <p className="text-sm text-muted-light">{note.content}</p>
                  </div>
                  <button
                    onClick={() => handleRemoveNote(note.id)}
                    className="text-muted hover:text-danger"
                    aria-label="حذف الملاحظة"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'bookmarks' && (
        <div>
          <div className="mb-6">
            <Button size="sm" variant="outline" onClick={handleAddBookmark}>
              <BookmarkIcon size={14} className="ml-1.5" /> إضافة علامة عند اللحظة الحالية
            </Button>
          </div>

          {bookmarks.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-light">
              لسه مافيش علامات مرجعية على الدرس ده
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {bookmarks.map((bookmark) => (
                <div
                  key={bookmark.id}
                  className="flex items-center gap-2 rounded-full border border-ink-border bg-ink-soft py-1.5 pe-2 ps-3 text-xs"
                >
                  <button
                    onClick={() => seekVideoTo(bookmark.timestampSec)}
                    className="flex items-center gap-1 font-semibold text-siraj-400 hover:underline"
                  >
                    <Play size={12} /> {bookmark.label ?? formatTime(bookmark.timestampSec)}
                  </button>
                  <button
                    onClick={() => handleRemoveBookmark(bookmark.id)}
                    className="text-muted hover:text-danger"
                    aria-label="حذف العلامة"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
