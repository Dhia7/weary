'use client';

import { useEffect, useRef, useState } from 'react';
import { PauseIcon, PlayIcon } from '@heroicons/react/24/outline';

const MOBILE_SRC = '/videos/hero-mobile.mp4?v=1';
const DESKTOP_SRC = '/videos/hero.mp4?v=4';
const POSTER_SRC = '/images/hero-video-poster.jpg';

type HeroBackgroundVideoProps = {
  isFrench: boolean;
};

function sourceMatches(currentSrc: string, next: string) {
  return currentSrc.includes(next);
}

export default function HeroBackgroundVideo({ isFrench }: HeroBackgroundVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const userPausedRef = useRef(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Muted has to be set on the element itself or desktop browsers block autoplay.
    video.defaultMuted = true;
    video.muted = true;
    video.volume = 0;

    const startPlayback = () => {
      if (document.hidden) {
        video.pause();
        return;
      }
      if (userPausedRef.current || !video.paused) return;
      void video.play().catch(() => {});
    };

    const media = window.matchMedia('(min-width: 768px)');
    const onBreakpoint = () => {
      const next = media.matches ? DESKTOP_SRC : MOBILE_SRC;
      if (sourceMatches(video.currentSrc, next)) return;
      userPausedRef.current = false;
      setPaused(false);
      video.src = next;
      video.load();
    };

    startPlayback();
    video.addEventListener('loadeddata', startPlayback);
    video.addEventListener('canplay', startPlayback);
    document.addEventListener('visibilitychange', startPlayback);
    media.addEventListener('change', onBreakpoint);
    return () => {
      video.removeEventListener('loadeddata', startPlayback);
      video.removeEventListener('canplay', startPlayback);
      document.removeEventListener('visibilitychange', startPlayback);
      media.removeEventListener('change', onBreakpoint);
    };
  }, []);

  const togglePaused = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      userPausedRef.current = false;
      setPaused(false);
      void video.play().catch(() => {});
      return;
    }
    userPausedRef.current = true;
    setPaused(true);
    video.pause();
  };

  const pauseLabel = paused
    ? isFrench
      ? 'Lire la vidéo'
      : 'Play video'
    : isFrench
      ? 'Mettre en pause'
      : 'Pause video';

  return (
    <>
      <video
        ref={videoRef}
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
        poster={POSTER_SRC}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
      >
        <source src={DESKTOP_SRC} type="video/mp4" media="(min-width: 768px)" />
        <source src={MOBILE_SRC} type="video/mp4" media="(max-width: 767px)" />
      </video>
      <span className="sr-only">{isFrench ? 'Hero mode suisse' : 'Swiss fashion hero'}</span>
      <div className="absolute bottom-6 right-6 z-30 flex items-center gap-2 md:bottom-10 md:right-8">
        <button
          type="button"
          onClick={togglePaused}
          aria-pressed={paused}
          aria-label={pauseLabel}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-swisse-ink/15 bg-swisse-canvas/75 text-swisse-ink shadow-sm backdrop-blur-sm transition-colors hover:text-swisse-gold dark:border-swisse-canvas/20 dark:bg-swisse-ink/70 dark:text-swisse-canvas"
        >
          {paused ? (
            <PlayIcon className="h-5 w-5" aria-hidden="true" />
          ) : (
            <PauseIcon className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
      </div>
    </>
  );
}
