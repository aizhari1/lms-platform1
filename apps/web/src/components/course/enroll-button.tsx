'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import { Button } from '@/components/ui/button';

export function EnrollButton({
  courseId,
  locale,
  isFree,
}: {
  courseId: string;
  locale: string;
  isFree: boolean;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleClick() {
    const hasToken =
      typeof window !== 'undefined' && sessionStorage.getItem('accessToken');

    if (!hasToken) {
      router.push(`/${locale}/login`);
      return;
    }

    setIsLoading(true);
    try {
      if (isFree) {
        await apiClient.post('/enrollments/free', { courseId });
        router.push(`/${locale}/student/my-courses`);
      } else {
        const { data } = await apiClient.post('/payments/checkout', {
          courseId,
          provider: 'STRIPE',
        });
        if (data.data.redirectUrl) {
          window.location.href = data.data.redirectUrl;
        }
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button onClick={handleClick} isLoading={isLoading} className="w-full">
      {isFree ? 'اشترك مجانًا' : 'اشترِ الآن'}
    </Button>
  );
}
