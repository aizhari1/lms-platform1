import { notFound, redirect } from 'next/navigation';
import { fetchCourseBySlug } from '@/lib/api/courses';

/**
 * Entry point for "continue learning" / "start course" links that don't yet
 * know which lesson to open. Resolves the course's first lesson and
 * redirects into the actual player route at /course/[slug]/learn/[lessonId].
 */
export default async function LearnEntryPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;

  const course = await fetchCourseBySlug(slug).catch(() => null);
  if (!course) {
    notFound();
  }

  const firstLesson = course.chapters?.[0]?.lessons?.[0];
  if (!firstLesson) {
    // Course has no content yet — send the student back to the course page
    // instead of a dead end.
    redirect(`/${locale}/courses/${slug}`);
  }

  redirect(`/${locale}/course/${slug}/learn/${firstLesson.id}`);
}
