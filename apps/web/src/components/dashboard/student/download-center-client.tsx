'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText, FileArchive, FileSpreadsheet, File, Bookmark, BookmarkCheck, Download } from 'lucide-react';
import {
  fetchDownloadCenter,
  fetchSavedResources,
  saveResource,
  unsaveResource,
  type ResourceItem,
} from '@/lib/api/resources';

const FILE_ICONS: Record<string, typeof File> = {
  pdf: FileText,
  zip: FileArchive,
  xlsx: FileSpreadsheet,
  doc: FileText,
  docx: FileText,
};

function formatSize(kb: number | null) {
  if (!kb) return '';
  if (kb < 1024) return `${kb} كيلوبايت`;
  return `${(kb / 1024).toFixed(1)} ميجابايت`;
}

export function DownloadCenterClient({ locale }: { locale: string }) {
  const [tab, setTab] = useState<'all' | 'saved'>('all');
  const [all, setAll] = useState<ResourceItem[]>([]);
  const [saved, setSaved] = useState<ResourceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  function loadAll() {
    Promise.all([fetchDownloadCenter().catch(() => []), fetchSavedResources().catch(() => [])])
      .then(([a, s]) => {
        setAll(a);
        setSaved(s);
      })
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleToggleSave(resource: ResourceItem) {
    if (resource.isSaved) {
      await unsaveResource(resource.id);
    } else {
      await saveResource(resource.id);
    }
    loadAll();
  }

  const list = tab === 'all' ? all : saved;

  if (isLoading) {
    return (
      <div className="space-y-3 p-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card-surface h-16 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-2 border-b border-ink-border">
        <button
          onClick={() => setTab('all')}
          className={`border-b-2 px-4 py-2.5 text-sm font-bold transition ${
            tab === 'all'
              ? 'border-siraj-500 text-white'
              : 'border-transparent text-muted-light hover:text-white'
          }`}
        >
          كل الملفات ({all.length})
        </button>
        <button
          onClick={() => setTab('saved')}
          className={`border-b-2 px-4 py-2.5 text-sm font-bold transition ${
            tab === 'saved'
              ? 'border-siraj-500 text-white'
              : 'border-transparent text-muted-light hover:text-white'
          }`}
        >
          المحفوظة ({saved.length})
        </button>
      </div>

      {list.length === 0 ? (
        <div className="card-surface flex flex-col items-center gap-3 p-12 text-center">
          <Download size={40} className="text-siraj-500" />
          <p className="text-muted">
            {tab === 'all'
              ? 'مفيش ملفات متاحة للتنزيل في كورساتك لسه'
              : 'لسه محفظتش أي ملف — دوس على أيقونة الحفظ جنب أي ملف'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {list.map((resource) => {
            const Icon = FILE_ICONS[resource.fileType] ?? File;
            const isSaved = tab === 'saved' ? true : resource.isSaved;
            return (
              <div key={resource.id} className="card-surface flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-siraj-900/40 text-siraj-400">
                  <Icon size={18} />
                </div>

                <div className="flex-1">
                  <p className="text-sm font-bold text-white">{resource.titleAr}</p>
                  <Link
                    href={`/${locale}/course/${resource.course?.slug}/learn/${resource.lesson.id}`}
                    className="text-xs text-siraj-400 hover:underline"
                  >
                    {resource.course?.titleAr} — {resource.lesson.titleAr}
                  </Link>
                  {resource.fileSizeKb && (
                    <span className="ms-2 text-xs text-muted">{formatSize(resource.fileSizeKb)}</span>
                  )}
                </div>

                <button
                  onClick={() => handleToggleSave({ ...resource, isSaved })}
                  className="text-muted hover:text-siraj-400"
                  aria-label="حفظ الملف"
                >
                  {isSaved ? <BookmarkCheck size={18} className="text-siraj-400" /> : <Bookmark size={18} />}
                </button>

                <a
                  href={resource.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-siraj-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-siraj-400"
                >
                  تنزيل
                </a>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
