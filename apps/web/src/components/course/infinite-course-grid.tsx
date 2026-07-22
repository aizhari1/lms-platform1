'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { CourseCard } from './course-card';
import { fetchCourses, type PaginatedCourses } from '@/lib/api/courses';

export function InfiniteCourseGrid({
  initialItems,
  initialMeta,
  locale,
  search,
  sort,
}: {
  initialItems: PaginatedCourses['items'];
  initialMeta: PaginatedCourses['meta'];
  locale: string;
  search?: string;
  sort?: string;
}) {
  const [items, setItems] = useState(initialItems);
  const [meta, setMeta] = useState(initialMeta);
  const [isLoading, setIsLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Reset when the underlying search/sort changes (new server-rendered page).
  useEffect(() => {
    setItems(initialItems);
    setMeta(initialMeta);
  }, [initialItems, initialMeta]);

  useEffect(() => {
    if (!meta.hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading) {
          loadNextPage();
        }
      },
      { rootMargin: '400px' }, // start fetching a bit before it's actually visible
    );

    const node = sentinelRef.current;
    if (node) observer.observe(node);
    return () => {
      if (node) observer.unobserve(node);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta.hasNextPage, isLoading, items.length]);

  async function loadNextPage() {
    setIsLoading(true);
    try {
      const next = await fetchCourses({ page: meta.page + 1, limit: meta.limit, search, sort });
      setItems((prev) => [...prev, ...next.items]);
      setMeta(next.meta);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((course) => (
          <CourseCard key={course.id} course={course} locale={locale} />
        ))}
      </div>

      {meta.hasNextPage && (
        <div ref={sentinelRef} className="mt-8 flex justify-center py-4">
          {isLoading && <Loader2 size={22} className="animate-spin text-siraj-400" />}
        </div>
      )}
    </>
  );
}
