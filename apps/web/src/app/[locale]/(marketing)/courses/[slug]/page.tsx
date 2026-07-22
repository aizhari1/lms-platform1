import Image from 'next/image';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Star, Users, Clock, PlayCircle, FileText, Lock } from 'lucide-react';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';
import { EnrollButton } from '@/components/course/enroll-button';
import { RecordCourseView } from '@/components/course/record-course-view';
import { CourseOutcomesSection } from '@/components/course/course-outcomes-section';
import { CourseRoadmapSection } from '@/components/course/course-roadmap-section';
import { RelatedCoursesSection } from '@/components/course/related-courses-section';
import { CourseFaqSection } from '@/components/course/course-faq-section';
import { fetchCourseBySlug } from '@/lib/api/courses';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const course = await fetchCourseBySlug(slug).catch(() => null);
  if (!course) return {};

  return {
    title: course.metaTitle || course.titleAr,
    description: course.metaDescription || course.subtitleAr || undefined,
    keywords: course.metaKeywords || undefined,
    openGraph: {
      title: course.metaTitle || course.titleAr,
      description: course.metaDescription || course.subtitleAr || undefined,
      images: course.thumbnailUrl ? [course.thumbnailUrl] : undefined,
    },
  };
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;

  const course = await fetchCourseBySlug(slug).catch(() => null);
  if (!course) {
    notFound();
  }

  const hasDiscount =
    course.discountPrice && Number(course.discountPrice) < Number(course.price);

  return (
    <>
      <Navbar locale={locale} />
      <RecordCourseView courseId={course.id} />
      <main>
        {/* Header */}
        <section className="border-b border-ink-border bg-ink-soft">
          <div className="container-page grid grid-cols-1 gap-10 py-12 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <span className="mb-3 inline-block rounded-full bg-siraj-900/40 px-3 py-1 text-xs font-semibold text-siraj-400">
                {course.category.nameAr}
              </span>
              <h1 className="text-2xl font-extrabold sm:text-3xl">{course.titleAr}</h1>
              {course.subtitleAr && (
                <p className="mt-3 text-muted-light">{course.subtitleAr}</p>
              )}

              <div className="mt-5 flex flex-wrap items-center gap-5 text-sm text-muted">
                <span className="flex items-center gap-1.5">
                  <Star size={15} className="fill-siraj-400 text-siraj-400" />
                  {Number(course.averageRating).toFixed(1)} ({course.totalReviews} تقييم)
                </span>
                <span className="flex items-center gap-1.5">
                  <Users size={15} /> {course.totalStudents} طالب
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock size={15} /> {Math.floor(course.totalDurationSec / 3600)} ساعة محتوى
                </span>
              </div>

              <div className="mt-6 flex items-center gap-3">
                {course.teacher.avatarUrl && (
                  <Image
                    src={course.teacher.avatarUrl}
                    alt={course.teacher.fullName}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                )}
                <div>
                  <p className="text-sm font-semibold text-white">{course.teacher.fullName}</p>
                  <p className="text-xs text-muted">المدرّس</p>
                </div>
              </div>
            </div>

            {/* Purchase card */}
            <div className="card-surface h-fit p-6 lg:sticky lg:top-24">
              <div className="relative mb-4 aspect-video overflow-hidden rounded-xl bg-ink">
                {course.thumbnailUrl && (
                  <Image src={course.thumbnailUrl} alt={course.titleAr} fill className="object-cover" />
                )}
              </div>

              <div className="mb-4 flex items-baseline gap-2">
                {hasDiscount ? (
                  <>
                    <span className="font-display text-2xl font-extrabold text-siraj-400">
                      {course.discountPrice} {course.currency}
                    </span>
                    <span className="text-muted line-through">
                      {course.price} {course.currency}
                    </span>
                  </>
                ) : (
                  <span className="font-display text-2xl font-extrabold text-siraj-400">
                    {course.price} {course.currency}
                  </span>
                )}
              </div>

              <EnrollButton courseId={course.id} locale={locale} isFree={Number(course.price) === 0} />
            </div>
          </div>
        </section>

        {/* Curriculum */}
        <section className="container-page py-12">
          <h2 className="mb-6 text-xl font-bold text-white">محتوى الكورس</h2>
          <div className="space-y-4">
            {course.chapters?.map((chapter: any, idx: number) => (
              <div key={chapter.id} className="card-surface overflow-hidden">
                <div className="border-b border-ink-border bg-ink-soft px-5 py-3">
                  <h3 className="font-semibold text-white">
                    {idx + 1}. {chapter.titleAr}
                  </h3>
                </div>
                <ul>
                  {chapter.lessons.map((lesson: any) => (
                    <li
                      key={lesson.id}
                      className="flex items-center justify-between border-b border-ink-border/50 px-5 py-3 text-sm last:border-none"
                    >
                      <span className="flex items-center gap-2 text-muted-light">
                        {lesson.type === 'PDF' ? (
                          <FileText size={16} />
                        ) : (
                          <PlayCircle size={16} />
                        )}
                        {lesson.titleAr}
                      </span>
                      {!lesson.isFreePreview && <Lock size={14} className="text-muted" />}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <CourseOutcomesSection
          outcomes={course.outcomes ?? []}
          requirements={course.requirements ?? []}
        />
        <CourseRoadmapSection chapters={course.chapters ?? []} />
        <CourseFaqSection courseId={course.id} />
        <RelatedCoursesSection courseId={course.id} locale={locale} />
      </main>
      <Footer />
    </>
  );
}
