import { Milestone } from 'lucide-react';

interface Chapter {
  id: string;
  titleAr: string;
  lessons: { id: string }[];
}

export function CourseRoadmapSection({ chapters }: { chapters: Chapter[] }) {
  if (chapters.length === 0) return null;

  return (
    <section className="container-page border-t border-ink-border py-12">
      <h2 className="mb-8 flex items-center gap-2 text-xl font-bold text-white">
        <Milestone size={20} className="text-siraj-400" /> خارطة طريق الكورس
      </h2>

      <div className="relative flex gap-6 overflow-x-auto pb-4">
        <div className="absolute top-6 h-px w-full bg-ink-border" />
        {chapters.map((chapter, idx) => (
          <div key={chapter.id} className="relative z-10 flex w-52 shrink-0 flex-col items-center text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border-2 border-siraj-500 bg-ink font-display font-extrabold text-siraj-400">
              {idx + 1}
            </div>
            <p className="text-sm font-bold text-white">{chapter.titleAr}</p>
            <p className="mt-1 text-xs text-muted">{chapter.lessons.length} درس</p>
          </div>
        ))}
      </div>
    </section>
  );
}
