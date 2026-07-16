import { useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

/**
 * Keeps a component mounted for `exitMs` after `isOpen` flips to false, so a
 * CSS exit transition has time to play instead of the element vanishing
 * instantly. Pair with: `if (!shouldRender) return null;` and toggle an exit
 * class off `isClosing`. Reduced-motion users unmount immediately.
 */
export function useMountTransition(isOpen: boolean, exitMs = 150) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();
  const timeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    window.clearTimeout(timeoutRef.current);

    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
      return;
    }

    if (!shouldRender) return;

    if (prefersReducedMotion) {
      setShouldRender(false);
      setIsClosing(false);
      return;
    }

    setIsClosing(true);
    timeoutRef.current = window.setTimeout(() => {
      setShouldRender(false);
      setIsClosing(false);
    }, exitMs);
  }, [isOpen, shouldRender, exitMs, prefersReducedMotion]);

  useEffect(() => () => window.clearTimeout(timeoutRef.current), []);

  return { shouldRender, isClosing };
}
