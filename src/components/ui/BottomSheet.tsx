import { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { useSwipeToClose } from '../../hooks/useSwipeToClose';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  /** id of the heading element inside `children` that titles the dialog. */
  labelledBy: string;
  /** Extra classes for the sheet panel (spacing, width overrides). */
  className?: string;
  children: ReactNode;
}

/**
 * Mobile-first modal sheet: anchors to the bottom edge below `sm` (with a
 * swipe-to-close grab handle) and becomes a centered dialog at `sm` and up.
 * Portals to <body> so ancestors with backdrop-filter (e.g. the sticky search
 * header) can't hijack its fixed positioning. Handles focus trap and Escape.
 */
export default function BottomSheet({ isOpen, onClose, labelledBy, className = '', children }: BottomSheetProps) {
  const sheetRef = useFocusTrap<HTMLDivElement>(isOpen);
  useEscapeKey(onClose, isOpen);
  const swipeHandlers = useSwipeToClose<HTMLDivElement>(onClose);

  if (!isOpen) return null;

  return createPortal(
    // Backdrop click is a pointer-only convenience; Escape and the sheet's own buttons cover keyboard users.
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
    <div
      className="modal-overlay modal-overlay-sheet z-[var(--z-overlay)]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={`modal-container modal-sheet-panel sm:max-w-md overflow-y-auto animate-fadeIn ${className}`}
      >
        {/* Grab handle: swipe down to close (mobile bottom-sheet only). */}
        <div
          className="sm:hidden -mt-6 -mx-6 mb-3 flex justify-center pt-2.5 pb-1"
          {...swipeHandlers}
          aria-hidden="true"
        >
          <div className="w-10 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}
