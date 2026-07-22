'use client';

import { useEffect, useState } from 'react';
import { Megaphone } from 'lucide-react';
import { fetchCourseAnnouncements, type CourseAnnouncement } from '@/lib/api/course-extras';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function CourseAnnouncementsPanel({ courseId }: { courseId: string }) {
  const [announcements, setAnnouncements] = useState<CourseAnnouncement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCourseAnnouncements(courseId)
      .then(setAnnouncements)
      .catch(() => setAnnouncements([]))
      .finally(() => setIsLoading(false));
  }, [courseId]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="card-surface h-16 animate-pulse" />
        ))}
      </div>
    );
  }

  if (announcements.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-light">مفيش إعلانات للكورس ده لسه</p>
    );
  }

  return (
    <div className="space-y-3">
      {announcements.map((a) => (
        <div key={a.id} className="card-surface p-4">
          <div className="mb-1 flex items-center gap-2">
            <Megaphone size={14} className="text-siraj-400" />
            <h4 className="text-sm font-bold text-white">{a.titleAr}</h4>
          </div>
          <p className="text-sm text-muted-light">{a.bodyAr}</p>
          <p className="mt-2 text-xs text-muted">{formatDate(a.createdAt)}</p>
        </div>
      ))}
    </div>
  );
}
