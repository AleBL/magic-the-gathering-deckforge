import { useCallback, useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

/**
 * Delays an unmount just long enough for a CSS exit transition to play.
 * Call `requestClose()` instead of `onClose()` directly: it flips
 * `isClosing` (drive an exit class off it) and only fires the real
 * `onClose` once `durationMs` has elapsed. Reduced-motion users skip the
 * wait entirely — `onClose` fires on the same tick.
 */
export function useDismissTransition(onClose: () => void, durationMs = 150) {
  const [isClosing, setIsClosing] = useState(false);
  const timeoutRef = useRef<number | undefined>(undefined);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => () => window.clearTimeout(timeoutRef.current), []);

  const requestClose = useCallback(() => {
    if (isClosing) return;
    if (prefersReducedMotion) {
      onClose();
      return;
    }
    setIsClosing(true);
    timeoutRef.current = window.setTimeout(onClose, durationMs);
  }, [isClosing, onClose, durationMs, prefersReducedMotion]);

  return { isClosing, requestClose };
}
