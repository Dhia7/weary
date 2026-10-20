'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { PauseIcon, PlayIcon, SpeakerWaveIcon, SpeakerXMarkIcon } from '@heroicons/react/24/outline';
import { HOME_IMAGES } from '@/lib/homeImages';

const MOBILE_SRC = '/videos/hero-mobile.mp4?v=1';
const DESKTOP_SRC = '/videos/hero.mp4?v=3';

function subscribeHeroSource(onStoreChange: () => void) {
  const media = window.matchMedia('(min-width: 768px)');
  media.addEventListener('change', onStoreChange);
  return () => media.removeEventListener('change', onStoreChange);
}

function heroSource() {
  return window.matchMedia('(min-width: 768px)').matches ? DESKTOP_SRC : MOBILE_SRC;
}

type HeroBackgroundVideoProps = {
  isFrench: boolean;
};

export default function HeroBackgroundVideo({ isFrench }: HeroBackgroundVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const volumeRef = useRef<HTMLDivElement>(null);
  const rememberedVolume = useRef(1);
  const userPausedRef = useRef(false);
  const draggingVolume = useRef(false);
  const [muted, setMuted] = useState(true);
  const [volume, setVolume] = useState(1);
  const [paused, setPaused] = useState(false);
  const [volumeOpen, setVolumeOpen] = useState(false);
  const src = useSyncExternalStore(subscribeHeroSource, heroSource, () => MOBILE_SRC);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Muted has to be set on the element itself or desktop browsers block autoplay.
    video.defaultMuted = true;
    video.muted = true;
    userPausedRef.current = false;
    setPaused(false);

    const startPlayback = () => {
      if (document.hidden) {
        video.pause();
        return;
      }
      if (userPausedRef.current || !video.paused) return;
      void video.play().catch(() => {});
    };

    startPlayback();
    video.addEventListener('loadeddata', startPlayback);
    video.addEventListener('canplay', startPlayback);
    document.addEventListener('visibilitychange', startPlayback);
    return () => {
      video.removeEventListener('loadeddata', startPlayback);
      video.removeEventListener('canplay', startPlayback);
      document.removeEventListener('visibilitychange', startPlayback);
    };
  }, [src]);

  useEffect(() => {
    const endDrag = () => {
      if (!draggingVolume.current) return;
      draggingVolume.current = false;
      const root = volumeRef.current;
      const stillInside =
        !!root && (root.matches(':hover') || root.contains(document.activeElement));
      if (!stillInside) setVolumeOpen(false);
    };
    window.addEventListener('pointerup', endDrag);
    return () => window.removeEventListener('pointerup', endDrag);
  }, []);

  const applyLevel = (level: number, remember: boolean) => {
    const video = videoRef.current;
    const clamped = Math.min(1, Math.max(0, level));
    if (remember && clamped > 0) rememberedVolume.current = clamped;
    setVolume(clamped);
    setMuted(clamped === 0);
    if (!video) return;
    video.volume = clamped === 0 ? rememberedVolume.current : clamped;
    video.muted = clamped === 0;
  };

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

  const toggleMuted = () => {
    if (muted) {
      applyLevel(rememberedVolume.current || 1, false);
      return;
    }
    applyLevel(0, false);
  };

  const label = muted
    ? isFrench
      ? 'Activer le son'
      : 'Unmute video'
    : isFrench
      ? 'Couper le son'
      : 'Mute video';
  const volumeLabel = isFrench ? 'Volume de la vidéo' : 'Video volume';
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
        key={src}
        ref={videoRef}
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
        src={src}
        poster={HOME_IMAGES.hero}
        autoPlay
        loop
        muted={muted}
        playsInline
        preload="auto"
        aria-hidden="true"
      />
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
        <div
          ref={volumeRef}
          className="group relative"
          onMouseEnter={() => setVolumeOpen(true)}
          onMouseLeave={() => {
            if (!draggingVolume.current) setVolumeOpen(false);
          }}
          onFocus={() => setVolumeOpen(true)}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setVolumeOpen(false);
          }}
        >
          <div
            className={`absolute bottom-full left-1/2 z-20 -translate-x-1/2 px-3 pb-2 transition-opacity duration-150 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100 ${
              volumeOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
          >
            <label className="flex items-center justify-center rounded-full border border-swisse-ink/15 bg-swisse-canvas/75 px-1.5 py-3 text-swisse-ink shadow-sm backdrop-blur-sm dark:border-swisse-canvas/20 dark:bg-swisse-ink/70 dark:text-swisse-canvas">
              <span className="sr-only">{volumeLabel}</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={muted ? 0 : volume}
                aria-label={volumeLabel}
                onPointerDown={() => {
                  draggingVolume.current = true;
                  setVolumeOpen(true);
                }}
                onChange={(event) => applyLevel(Number(event.target.value), true)}
                className="h-28 w-7 cursor-pointer accent-swisse-gold [direction:rtl] [writing-mode:vertical-lr]"
              />
            </label>
          </div>
          <button
            type="button"
            onClick={toggleMuted}
            aria-pressed={muted}
            aria-label={label}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-swisse-ink/15 bg-swisse-canvas/75 text-swisse-ink shadow-sm backdrop-blur-sm transition-colors hover:text-swisse-gold dark:border-swisse-canvas/20 dark:bg-swisse-ink/70 dark:text-swisse-canvas"
          >
            {muted ? (
              <SpeakerXMarkIcon className="h-5 w-5" aria-hidden="true" />
            ) : (
              <SpeakerWaveIcon className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    </>
  );
}
