import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';
import { InfiniteCourseGrid } from '@/components/course/infinite-course-grid';
import { fetchCourses } from '@/lib/api/courses';

export default async function CoursesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string; search?: string; sort?: string }>;
}) {
  const { locale } = await params;
  const { page, search, sort } = await searchParams;

  const { items, meta } = await fetchCourses({
    page: page ? Number(page) : 1,
    search,
    sort,
    limit: 12,
  }).catch(() => ({
    items: [] as Awaited<ReturnType<typeof fetchCourses>>['items'],
    meta: { page: 1, limit: 12, totalItems: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false },
  }));

  return (
    <>
      <Navbar locale={locale} />
      <main className="container-page py-16">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-extrabold sm:text-4xl">تصفح الكورسات</h1>
          <p className="mt-2 text-muted">{meta.totalItems} كورس متاح لتطوير مهاراتك</p>
        </div>

        {items.length === 0 ? (
          <div className="card-surface p-12 text-center text-muted">
            لا توجد كورسات مطابقة حاليًا — جرّب البحث بكلمات مختلفة
          </div>
        ) : (
          <InfiniteCourseGrid
            initialItems={items}
            initialMeta={meta}
            locale={locale}
            search={search}
            sort={sort}
          />
        )}
      </main>
      <Footer />
    </>
  );
}
