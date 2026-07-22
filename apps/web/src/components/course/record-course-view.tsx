'use client';

import { useEffect } from 'react';
import { recordCourseView } from '@/lib/api/recently-viewed';

/**
 * Fires once when a logged-in student opens a course detail page. Silently
 * no-ops for guests or teachers (the API call is skipped/ignored on 401/403).
 */
export function RecordCourseView({ courseId }: { courseId: string }) {
  useEffect(() => {
    recordCourseView(courseId);
  }, [courseId]);

  return null;
}
