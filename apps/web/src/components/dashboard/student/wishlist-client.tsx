'use client';

import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { fetchMyWishlist } from '@/lib/api/student';
import { CourseCard } from '@/components/course/course-card';

export function WishlistClient({ locale }: { locale: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMyWishlist()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setIsLoading(false));
  }, []);

  async function handleRemove(courseId: string) {
    await apiClient.delete(`/wishlist/${courseId}`);
    setItems((prev) => prev.filter((item) => item.course.id !== courseId));
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card-surface h-64 animate-pulse" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="p-6">
        <div className="card-surface flex flex-col items-center gap-3 p-12 text-center">
          <Heart size={40} className="text-siraj-500" />
          <p className="text-muted">قائمة المفضلة فاضية — أضف الكورسات اللي تهمك لمتابعتها بعدين</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <div key={item.id} className="relative">
          <CourseCard course={item.course} locale={locale} />
          <button
            onClick={() => handleRemove(item.course.id)}
            className="absolute top-3 flex h-8 w-8 items-center justify-center rounded-full bg-ink/80 text-danger backdrop-blur ltr:right-3 rtl:left-3"
            aria-label="إزالة من المفضلة"
          >
            <Heart size={15} className="fill-danger" />
          </button>
        </div>
      ))}
    </div>
  );
}
