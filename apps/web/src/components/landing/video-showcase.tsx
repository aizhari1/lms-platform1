import { getTranslations } from 'next-intl/server';

export async function VideoShowcase() {
  const t = await getTranslations('video');

  return (
    <section className="container-page py-20">
      <div className="mb-10 text-center">
        <span className="text-sm font-semibold text-siraj-400">{t('eyebrow')}</span>
        <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">{t('title')}</h2>
      </div>

      <div className="card-surface mx-auto max-w-4xl overflow-hidden border-siraj-700/30 p-2 shadow-2xl">
        <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-ink-soft">
          {/* TODO: استبدل الـ VIDEO_ID بمعرّف فيديو سراج التعريفي على يوتيوب */}
          <iframe
            className="absolute inset-0 h-full w-full"
            src="https://www.youtube.com/embed/VIDEO_ID"
            title={t('title')}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </section>
  );
}
