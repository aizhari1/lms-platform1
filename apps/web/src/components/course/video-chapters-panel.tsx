'use client';

import { ListVideo, Play } from 'lucide-react';

interface Chapter {
  label: string;
  timeSec: number;
}

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function VideoChaptersPanel({ chapters }: { chapters: Chapter[] }) {
  if (!chapters || chapters.length === 0) return null;

  function seekTo(seconds: number) {
    const video = document.querySelector('video');
    if (video) {
      video.currentTime = seconds;
      video.play().catch(() => {});
    }
  }

  return (
    <div className="card-surface mt-4 p-4">
      <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-white">
        <ListVideo size={16} className="text-siraj-400" /> فصول الفيديو
      </h4>
      <div className="space-y-1">
        {chapters.map((chapter, idx) => (
          <button
            key={idx}
            onClick={() => seekTo(chapter.timeSec)}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-start text-sm text-muted-light hover:bg-ink-soft hover:text-white"
          >
            <Play size={12} className="text-siraj-400" />
            <span className="flex-1">{chapter.label}</span>
            <span className="text-xs text-muted">{formatTime(chapter.timeSec)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
