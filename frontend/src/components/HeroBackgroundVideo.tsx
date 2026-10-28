'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { PauseIcon, PlayIcon } from '@heroicons/react/24/outline';

const MOBILE_SRC = '/videos/hero-mobile.mp4?v=1';
const DESKTOP_SRC = '/videos/hero.mp4?v=4';
const POSTER_SRC = '/images/hero-video-poster.jpg';

const GESTURE_EVENTS = ['touchstart', 'pointerdown', 'scroll'] as const;

type HeroBackgroundVideoProps = {
  isFrench: boolean;
  preferMobile: boolean;
};

function armAutoplay(video: HTMLVideoElement) {
  // The muted attribute is not enough: browsers read the DOM property, and React
  // does not always set it before the autoplay check. Phones then draw a start button.
  video.defaultMuted = true;
  video.muted = true;
  video.volume = 0;
  video.playsInline = true;
  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', 'true');
}

export default function HeroBackgroundVideo({ isFrench, preferMobile }: HeroBackgroundVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const userPausedRef = useRef(false);
  const [paused, setPaused] = useState(false);
  const initialSrc = preferMobile ? MOBILE_SRC : DESKTOP_SRC;

  const setVideoRef = useCallback((node: HTMLVideoElement | null) => {
    videoRef.current = node;
    if (!node) return;
    armAutoplay(node);
    if (node.paused && !document.hidden) {
      void node.play().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    armAutoplay(video);
    let gestureArmed = false;

    const detachGesture = () => {
      if (!gestureArmed) return;
      gestureArmed = false;
      for (const eventName of GESTURE_EVENTS) {
        window.removeEventListener(eventName, startPlayback);
      }
    };

    const attachGesture = () => {
      if (gestureArmed || userPausedRef.current) return;
      gestureArmed = true;
      for (const eventName of GESTURE_EVENTS) {
        window.addEventListener(eventName, startPlayback, { passive: true });
      }
    };

    function startPlayback() {
      if (!video || userPausedRef.current || document.hidden) return;
      armAutoplay(video);
      if (!video.paused) {
        detachGesture();
        return;
      }
      const pending = video.play();
      if (!pending) return;
      pending.then(() => {
        detachGesture();
      }).catch(() => {
        // Low Power Mode and in-app browsers can block the first attempt.
        // The next touch or scroll on the page starts it, with no play button.
        attachGesture();
      });
    }

    const media = window.matchMedia('(min-width: 768px)');
    const onBreakpoint = () => {
      const next = media.matches ? DESKTOP_SRC : MOBILE_SRC;
      if ((video.currentSrc || video.src).includes(next)) return;
      userPausedRef.current = false;
      setPaused(false);
      video.src = next;
      armAutoplay(video);
      startPlayback();
    };

    const onVisible = () => {
      if (!document.hidden) startPlayback();
    };

    let autoRetries = 0;
    const onPause = () => {
      if (userPausedRef.current || document.hidden) return;
      if (autoRetries >= 5) {
        attachGesture();
        return;
      }
      autoRetries += 1;
      window.setTimeout(startPlayback, 200);
    };
    const onPlaying = () => {
      autoRetries = 0;
      detachGesture();
    };

    startPlayback();
    const retries = [300, 1000, 2500].map((delay) => window.setTimeout(startPlayback, delay));

    video.addEventListener('loadeddata', startPlayback);
    video.addEventListener('canplay', startPlayback);
    video.addEventListener('pause', onPause);
    video.addEventListener('playing', onPlaying);
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('pageshow', startPlayback);
    media.addEventListener('change', onBreakpoint);

    return () => {
      for (const id of retries) window.clearTimeout(id);
      video.removeEventListener('loadeddata', startPlayback);
      video.removeEventListener('canplay', startPlayback);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('playing', onPlaying);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('pageshow', startPlayback);
      media.removeEventListener('change', onBreakpoint);
      detachGesture();
    };
  }, []);

  const togglePaused = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      userPausedRef.current = false;
      setPaused(false);
      armAutoplay(video);
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
        ref={setVideoRef}
        className="hero-video pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
        src={initialSrc}
        poster={POSTER_SRC}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        disablePictureInPicture
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
      </div>
    </>
  );
}
