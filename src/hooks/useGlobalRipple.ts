import { useEffect } from 'react';
import { spawnRippleAt } from '../utils/rippleEffect';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

const RIPPLE_TARGET_SELECTOR = '.primary-button';

/**
 * App-wide ripple feedback for primary buttons, via one delegated listener
 * instead of wiring useRipple's onClick/className at every call site. Mount
 * once near the app root; covers every current and future .primary-button.
 */
export function useGlobalRipple() {
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) return;

    function handlePointerDown(e: PointerEvent) {
      if (e.button !== 0) return;
      const target = (e.target as HTMLElement).closest<HTMLElement>(RIPPLE_TARGET_SELECTOR);
      if (!target || target.hasAttribute('disabled')) return;
      spawnRippleAt(target, e.clientX, e.clientY);
    }

    window.addEventListener('pointerdown', handlePointerDown);
    return () => window.removeEventListener('pointerdown', handlePointerDown);
  }, [prefersReducedMotion]);
}
