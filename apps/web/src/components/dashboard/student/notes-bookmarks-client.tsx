'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { StickyNote, Bookmark as BookmarkIcon, Trash2, Play } from 'lucide-react';
import {
  fetchMyNotes,
  fetchMyBookmarks,
  deleteNote,
  deleteBookmark,
  type NoteItem,
  type BookmarkItem,
} from '@/lib/api/notes';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { toast } from '@/lib/toast';

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function NotesBookmarksClient({ locale }: { locale: string }) {
  const [tab, setTab] = useState<'notes' | 'bookmarks'>('notes');
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { confirm } = useConfirm();

  useEffect(() => {
    Promise.all([fetchMyNotes(), fetchMyBookmarks()])
      .then(([n, b]) => {
        setNotes(n);
        setBookmarks(b);
      })
      .catch(() => {
        setNotes([]);
        setBookmarks([]);
      })
      .finally(() => setIsLoading(false));
  }, []);

  async function handleRemoveNote(noteId: string) {
    const confirmed = await confirm({
      title: 'حذف الملاحظة؟',
      description: 'مش هينفع ترجعها تاني بعد الحذف',
      confirmLabel: 'حذف',
      isDangerous: true,
    });
    if (!confirmed) return;

    await deleteNote(noteId);
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
    toast.success('اتحذفت الملاحظة');
  }

  async function handleRemoveBookmark(bookmarkId: string) {
    const confirmed = await confirm({
      title: 'حذف العلامة المرجعية؟',
      confirmLabel: 'حذف',
      isDangerous: true,
    });
    if (!confirmed) return;

    await deleteBookmark(bookmarkId);
    setBookmarks((prev) => prev.filter((b) => b.id !== bookmarkId));
    toast.success('اتحذفت العلامة');
  }

  function lessonHref(item: NoteItem | BookmarkItem) {
    return `/${locale}/course/${item.course.slug}/learn/${item.lesson.id}`;
  }

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card-surface h-20 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-2 border-b border-ink-border">
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

      {tab === 'notes' &&
        (notes.length === 0 ? (
          <div className="card-surface flex flex-col items-center gap-3 p-12 text-center">
            <StickyNote size={40} className="text-siraj-500" />
            <p className="text-muted">لسه معملتش أي ملاحظات — دوّن أفكارك وأنت بتشاهد الدروس</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <div key={note.id} className="card-surface flex items-start justify-between gap-3 p-4">
                <div className="flex-1">
                  <Link
                    href={lessonHref(note)}
                    className="mb-1 block text-xs font-semibold text-siraj-400 hover:underline"
                  >
                    {note.course.titleAr} — {note.lesson.titleAr}
                    {note.timestampSec !== null && (
                      <span className="ms-1 inline-flex items-center gap-1">
                        <Play size={10} className="inline" /> {formatTime(note.timestampSec)}
                      </span>
                    )}
                  </Link>
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
        ))}

      {tab === 'bookmarks' &&
        (bookmarks.length === 0 ? (
          <div className="card-surface flex flex-col items-center gap-3 p-12 text-center">
            <BookmarkIcon size={40} className="text-siraj-500" />
            <p className="text-muted">لسه مافيش علامات مرجعية — احفظ اللحظات المهمة في الدروس</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bookmarks.map((bookmark) => (
              <div
                key={bookmark.id}
                className="card-surface flex items-center justify-between gap-3 p-4"
              >
                <Link href={lessonHref(bookmark)} className="flex-1">
                  <p className="mb-1 text-xs font-semibold text-siraj-400">
                    {bookmark.course.titleAr} — {bookmark.lesson.titleAr}
                  </p>
                  <p className="flex items-center gap-1 text-sm text-muted-light">
                    <Play size={12} /> {bookmark.label ?? formatTime(bookmark.timestampSec)}
                  </p>
                </Link>
                <button
                  onClick={() => handleRemoveBookmark(bookmark.id)}
                  className="text-muted hover:text-danger"
                  aria-label="حذف العلامة"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        ))}
    </div>
  );
}
