import { useRef } from 'react';

const DISMISS_THRESHOLD_PX = 60;

/**
 * Touch handlers for a bottom-sheet's grab handle: swiping down past the
 * threshold closes the sheet. Attach only to a dedicated handle (not the
 * scrollable panel body) so the gesture never fights content scrolling.
 */
export function useSwipeToClose<T extends HTMLElement>(onClose: () => void) {
  const startY = useRef<number | null>(null);

  const onTouchStart = (e: React.TouchEvent<T>) => {
    startY.current = e.touches[0].clientY;
  };

  const onTouchEnd = (e: React.TouchEvent<T>) => {
    if (startY.current === null) return;
    const deltaY = e.changedTouches[0].clientY - startY.current;
    startY.current = null;
    if (deltaY > DISMISS_THRESHOLD_PX) onClose();
  };

  return { onTouchStart, onTouchEnd };
}
