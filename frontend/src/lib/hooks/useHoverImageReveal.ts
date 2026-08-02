'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from 'react';

const FINE_HOVER_MQ = '(hover: hover) and (pointer: fine)';
const REDUCED_MOTION_MQ = '(prefers-reduced-motion: reduce)';

function canFineHover(): boolean {
  if (typeof window === 'undefined') return true;
  return window.matchMedia(FINE_HOVER_MQ).matches;
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(REDUCED_MOTION_MQ).matches;
}

export type HoverImageRevealOptions = {
  /** In-view auto-swap for touch / no-hover devices. Default true. */
  autoCycle?: boolean;
};

/**
 * Reveals a secondary product image on desktop hover and on touch/no-hover
 * devices via press + optional calm in-view auto-swap so the alternate look
 * is visible without relying on CSS :hover.
 */
export function useHoverImageReveal(
  enabled: boolean,
  options: HoverImageRevealOptions = {}
): {
  containerRef: RefObject<HTMLDivElement | null>;
  revealed: boolean;
  imageSwapHandlers: {
    onPointerEnter: (e: ReactPointerEvent<HTMLDivElement>) => void;
    onPointerLeave: (e: ReactPointerEvent<HTMLDivElement>) => void;
    onPointerDown: (e: ReactPointerEvent<HTMLDivElement>) => void;
    onPointerUp: (e: ReactPointerEvent<HTMLDivElement>) => void;
    onPointerCancel: (e: ReactPointerEvent<HTMLDivElement>) => void;
  };
} {
  const autoCycle = options.autoCycle !== false;
  const [revealed, setRevealed] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const touchPeekRef = useRef(false);
  const cycleActiveRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      setRevealed(false);
      return;
    }
    if (!autoCycle) return;

    const el = containerRef.current;
    if (!el || typeof window === 'undefined') return;

    let cycleTimer: ReturnType<typeof setInterval> | null = null;
    let startTimer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const clearTimers = () => {
      if (cycleTimer) clearInterval(cycleTimer);
      if (startTimer) clearTimeout(startTimer);
      cycleTimer = null;
      startTimer = null;
    };

    const stopCycle = () => {
      clearTimers();
      cycleActiveRef.current = false;
      if (!touchPeekRef.current && !cancelled) {
        setRevealed(false);
      }
    };

    const startCycle = () => {
      if (canFineHover() || prefersReducedMotion() || cancelled) return;
      clearTimers();
      cycleActiveRef.current = true;
      // Show the alternate look shortly after the card settles in view, then swap calmly.
      startTimer = setTimeout(() => {
        if (cancelled || touchPeekRef.current) return;
        setRevealed(true);
        cycleTimer = setInterval(() => {
          if (cancelled || touchPeekRef.current) return;
          setRevealed((v) => !v);
        }, 2400);
      }, 700);
    };

    const syncForCapability = () => {
      if (canFineHover()) {
        stopCycle();
        return;
      }
      // Re-evaluate visibility after capability change (e.g. tablet mode).
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 0;
      const visible =
        rect.top < vh * 0.85 && rect.bottom > vh * 0.15 && rect.height > 0;
      if (visible) startCycle();
      else stopCycle();
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        if (canFineHover()) {
          stopCycle();
          return;
        }
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          startCycle();
        } else {
          stopCycle();
        }
      },
      { threshold: [0.5, 0.7] }
    );

    io.observe(el);

    const hoverMq = window.matchMedia(FINE_HOVER_MQ);
    const motionMq = window.matchMedia(REDUCED_MOTION_MQ);
    const onCapabilityChange = () => syncForCapability();
    hoverMq.addEventListener('change', onCapabilityChange);
    motionMq.addEventListener('change', onCapabilityChange);

    return () => {
      cancelled = true;
      io.disconnect();
      hoverMq.removeEventListener('change', onCapabilityChange);
      motionMq.removeEventListener('change', onCapabilityChange);
      clearTimers();
      cycleActiveRef.current = false;
      touchPeekRef.current = false;
    };
  }, [enabled, autoCycle]);

  const onPointerEnter = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!enabled) return;
      if (e.pointerType === 'mouse' || e.pointerType === 'pen') {
        setRevealed(true);
      }
    },
    [enabled]
  );

  const onPointerLeave = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!enabled) return;
      if (e.pointerType === 'mouse' || e.pointerType === 'pen') {
        setRevealed(false);
      }
    },
    [enabled]
  );

  const endTouchPeek = useCallback(() => {
    if (!touchPeekRef.current) return;
    touchPeekRef.current = false;
    // Resume whatever the in-view cycle wants; if not cycling, hide.
    if (!cycleActiveRef.current) {
      setRevealed(false);
    }
  }, []);

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!enabled) return;
      // When auto-cycling, in-view swap already covers touch devices;
      // peeking on pointerdown fights with scroll gestures on product grids.
      if (autoCycle) return;
      if (e.pointerType === 'touch') {
        touchPeekRef.current = true;
        setRevealed(true);
      }
    },
    [enabled, autoCycle]
  );

  const onPointerUp = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!enabled || autoCycle) return;
      if (e.pointerType === 'touch') {
        // Keep the peek visible briefly through the tap so the swap is noticeable.
        window.setTimeout(endTouchPeek, 280);
      }
    },
    [enabled, autoCycle, endTouchPeek]
  );

  const onPointerCancel = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!enabled || autoCycle) return;
      if (e.pointerType === 'touch') {
        endTouchPeek();
      }
    },
    [enabled, autoCycle, endTouchPeek]
  );

  return {
    containerRef,
    revealed,
    imageSwapHandlers: {
      onPointerEnter,
      onPointerLeave,
      onPointerDown,
      onPointerUp,
      onPointerCancel,
    },
  };
}
