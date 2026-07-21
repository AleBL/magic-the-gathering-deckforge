import { CSSProperties, useRef, useState } from 'react';

const DISMISS_THRESHOLD_PX = 150;

/**
 * Whether the touched element's nearest scrollable ancestor (if any) inside
 * the dialog is currently scrolled to the top. Walks up from the actual
 * touch target rather than trusting the element the handlers are attached
 * to, since that element isn't always the one that scrolls (e.g. a dialog
 * panel with `overflow-hidden` wrapping an inner `overflow-y-auto` body).
 * The walk stops at the dialog boundary (`role="dialog"`) so it never
 * wanders into the page behind the modal.
 */
function isAtScrollTop(target: EventTarget | null): boolean {
  let el = target instanceof HTMLElement ? target : null;
  while (el) {
    if (el.scrollHeight > el.clientHeight + 1) {
      return el.scrollTop <= 0;
    }
    if (el.getAttribute('role') === 'dialog') break;
    el = el.parentElement;
  }
  return true;
}

/**
 * Touch handlers for a bottom-sheet: dragging down anywhere on the sheet
 * follows the finger 1:1 and either dismisses it past the threshold or snaps
 * back with a short transition otherwise. Attach the returned handlers and
 * `panelStyle` to the sheet's outer dialog panel (the `role="dialog"`
 * element) so the whole sheet is draggable, matching how native bottom
 * sheets behave — not just a small dedicated handle.
 *
 * The gesture only engages when the drag starts with the touched content
 * already scrolled to the top: that's what lets a normal scroll-down gesture
 * coexist with drag-to-dismiss on the very same sheet, the same way
 * pull-to-refresh only kicks in at the top of a scrolled page.
 *
 * Two more non-obvious bits, both required for this to actually work on a phone:
 * - `panelStyle`'s `touch-action: pan-y` keeps native vertical scrolling
 *   working for panel content while still handing us the touch events needed
 *   to detect the down-drag; `none` would kill scrolling entirely, and the
 *   browser's default `auto` risks the page's own pull-to-refresh gesture
 *   racing our JS for the same touch.
 * - `panelStyle` moves the panel via the standalone `translate` property, not
 *   `transform` — the panel's own enter animation (`animate-fadeIn` /
 *   `animate-dialogEnter`) animates `transform`, and a CSS animation targeting
 *   a property wins over an inline style on that same property, which would
 *   make the drag look like it does nothing.
 */
export function useSwipeToClose<T extends HTMLElement>(onClose: () => void) {
  const startY = useRef<number | null>(null);
  const startedAtTop = useRef(false);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const onTouchStart = (e: React.TouchEvent<T>) => {
    startY.current = e.touches[0].clientY;
    startedAtTop.current = isAtScrollTop(e.target);
    setIsDragging(true);
  };

  const onTouchMove = (e: React.TouchEvent<T>) => {
    if (startY.current === null || !startedAtTop.current) return;
    setDragY(Math.max(0, e.touches[0].clientY - startY.current));
  };

  const onTouchEnd = (e: React.TouchEvent<T>) => {
    if (startY.current === null) return;
    const deltaY = e.changedTouches[0].clientY - startY.current;
    const shouldClose = startedAtTop.current && deltaY > DISMISS_THRESHOLD_PX;
    startY.current = null;
    setIsDragging(false);
    setDragY(0);
    if (shouldClose) onClose();
  };

  const panelStyle: CSSProperties = {
    translate: dragY ? `0 ${dragY}px` : undefined,
    transition: isDragging ? 'none' : 'translate 200ms ease-out',
    touchAction: 'pan-y'
  };

  return { onTouchStart, onTouchMove, onTouchEnd, panelStyle };
}
