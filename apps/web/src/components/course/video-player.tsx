'use client';

import { useEffect, useRef } from 'react';
import Plyr from 'plyr-react';
import 'plyr-react/plyr.css';
import { updateLessonProgress } from '@/lib/api/learn';

export function VideoPlayer({
  lessonId,
  videoUrl,
  initialPositionSec,
  subtitlesUrl,
  watermarkText,
  onCompleted,
  onEnded,
}: {
  lessonId: string;
  videoUrl: string;
  initialPositionSec?: number;
  subtitlesUrl?: string;
  watermarkText?: string;
  onCompleted?: () => void;
  onEnded?: () => void;
}) {
  const lastSavedRef = useRef(0);
  const hasMarkedCompleteRef = useRef(false);
  const hasSeekedRef = useRef(false);

  useEffect(() => {
    // Resume Playback — jump to where the student last left off, once,
    // as soon as the video has metadata (duration) available.
    hasSeekedRef.current = false;
    const video = document.querySelector('video');
    if (!video || !initialPositionSec) return;

    function seekToResumePoint() {
      if (hasSeekedRef.current || !video) return;
      hasSeekedRef.current = true;
      video.currentTime = initialPositionSec!;
    }

    video.addEventListener('loadedmetadata', seekToResumePoint);
    return () => video.removeEventListener('loadedmetadata', seekToResumePoint);
  }, [lessonId, initialPositionSec]);

  useEffect(() => {
    // Prevent Direct Download — best-effort deterrents (not real DRM):
    // hide the native download affordance and block right-click saving.
    const video = document.querySelector('video');
    if (video) {
      video.setAttribute('controlslist', 'nodownload noremoteplayback');
      video.setAttribute('disablePictureInPicture', 'false');
      video.oncontextmenu = (e) => e.preventDefault();
    }
  }, [lessonId]);

  useEffect(() => {
    // Save progress every 10 seconds of playback, not on every tick,
    // to avoid hammering the API.
    const interval = setInterval(() => {
      const video = document.querySelector('video');
      if (!video || video.paused) return;

      const currentTime = Math.floor(video.currentTime);
      if (Math.abs(currentTime - lastSavedRef.current) < 10) return;

      lastSavedRef.current = currentTime;
      const isNearEnd = Boolean(video.duration) && currentTime / video.duration > 0.9;

      updateLessonProgress(lessonId, {
        lastPositionSec: currentTime,
        watchedSeconds: currentTime,
        isCompleted: isNearEnd,
      }).then(() => {
        if (isNearEnd && !hasMarkedCompleteRef.current) {
          hasMarkedCompleteRef.current = true;
          onCompleted?.();
        }
      });
    }, 10_000);

    return () => clearInterval(interval);
  }, [lessonId, onCompleted]);

  useEffect(() => {
    // Auto Next Lesson — fires once when playback actually ends.
    const video = document.querySelector('video');
    if (!video || !onEnded) return;
    const handleEnded = () => onEnded();
    video.addEventListener('ended', handleEnded);
    return () => video.removeEventListener('ended', handleEnded);
  }, [lessonId, onEnded]);

  return (
    <div className="relative overflow-hidden rounded-xl2 bg-black">
      <Plyr
        source={{
          type: 'video',
          sources: [{ src: videoUrl, type: 'video/mp4' }],
          tracks: subtitlesUrl
            ? [{ kind: 'captions', label: 'العربية', srcLang: 'ar', src: subtitlesUrl, default: true }]
            : [],
        }}
        options={{
          seekTime: 10,
          keyboard: { focused: true, global: true },
          // Explicit so Playback Speed + Picture-in-Picture are guaranteed
          // present regardless of Plyr's own defaults changing later.
          controls: [
            'play-large',
            'play',
            'progress',
            'current-time',
            'duration',
            'mute',
            'volume',
            'captions',
            'settings',
            'pip',
            'fullscreen',
          ],
          settings: ['captions', 'speed'],
          speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] },
        }}
      />

      {/* Watermark with Student Name — subtle, semi-transparent, deters
          screen-recorded redistribution without obstructing the video. */}
      {watermarkText && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-end justify-end p-4">
          <span className="rounded bg-black/30 px-2 py-1 text-[11px] text-white/40">
            {watermarkText}
          </span>
        </div>
      )}
    </div>
  );
}
