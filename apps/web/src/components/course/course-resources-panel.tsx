'use client';

import { useEffect, useState } from 'react';
import { FileText, FileArchive, File, Download } from 'lucide-react';
import { fetchCourseResources, type ResourceItem } from '@/lib/api/resources';

const FILE_ICONS: Record<string, typeof File> = {
  pdf: FileText,
  zip: FileArchive,
};

export function CourseResourcesPanel({ courseId }: { courseId: string }) {
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCourseResources(courseId)
      .then(setResources)
      .catch(() => setResources([]))
      .finally(() => setIsLoading(false));
  }, [courseId]);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <div key={i} className="card-surface h-14 animate-pulse" />
        ))}
      </div>
    );
  }

  if (resources.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-light">مفيش ملفات قابلة للتنزيل في الكورس ده لسه</p>;
  }

  return (
    <div className="space-y-2">
      {resources.map((resource) => {
        const Icon = FILE_ICONS[resource.fileType] ?? File;
        return (
          <div key={resource.id} className="card-surface flex items-center gap-3 p-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-siraj-900/40 text-siraj-400">
              <Icon size={16} />
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">{resource.titleAr}</p>
              <p className="text-xs text-muted">{resource.lesson.titleAr}</p>
            </div>
            <a
              href={resource.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 rounded-lg bg-siraj-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-siraj-400"
            >
              <Download size={12} /> تنزيل
            </a>
          </div>
        );
      })}
    </div>
  );
}
