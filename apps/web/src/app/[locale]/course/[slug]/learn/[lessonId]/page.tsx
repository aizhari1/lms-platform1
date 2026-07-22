import { notFound } from 'next/navigation';
import { fetchCourseBySlug } from '@/lib/api/courses';
import { CoursePlayerClient } from '@/components/course/course-player-client';

export default async function LearnLessonPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string; lessonId: string }>;
}) {
  const { locale, slug, lessonId } = await params;

  const course = await fetchCourseBySlug(slug).catch(() => null);
  if (!course) {
    notFound();
  }

  return (
    <CoursePlayerClient
      courseId={course.id}
      courseSlug={slug}
      locale={locale}
      lessonId={lessonId}
      chapters={course.chapters}
    />
  );
}
