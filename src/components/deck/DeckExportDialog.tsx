import { useTranslation } from 'react-i18next';
import { Deck } from '../../types/Deck';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { useSwipeToClose } from '../../hooks/useSwipeToClose';

interface DeckExportDialogProps {
  deck: Deck;
  onExportJson: (deck: Deck) => void;
  onExportDec: (deck: Deck) => void;
  onCancel: () => void;
}

/** Prompt asking which file format to export a deck as (JSON or .dec). */
export function DeckExportDialog({ deck, onExportJson, onExportDec, onCancel }: DeckExportDialogProps) {
  const { t } = useTranslation();
  const dialogRef = useFocusTrap<HTMLDivElement>(true);
  useEscapeKey(onCancel);
  const swipeHandlers = useSwipeToClose<HTMLDivElement>(onCancel);

  return (
    // Backdrop click is a mouse-only convenience; Escape and the cancel button provide the keyboard-equivalent action.
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
    <div
      className="modal-overlay modal-overlay-sheet z-[var(--z-overlay)]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="deck-export-dialog-title"
        className="modal-container modal-sheet-panel sm:max-w-md overflow-y-auto animate-fadeIn"
      >
        {/* Grab handle: swipe down to close (mobile bottom-sheet only). */}
        <div
          className="sm:hidden -mt-6 -mx-6 mb-4 flex justify-center pt-2.5 pb-1"
          {...swipeHandlers}
          aria-hidden="true"
        >
          <div className="w-10 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>
        <h3 id="deck-export-dialog-title" className="text-xl font-bold text-slate-900 dark:text-white mb-4">
          {t('deck.export')} {deck.name}
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">{t('export.exportFormatPrompt')}</p>
        <div className="flex flex-col gap-3">
          <button
            type="button"
            className="w-full primary-button bg-indigo-600 hover:bg-indigo-700 py-3"
            onClick={() => onExportJson(deck)}
          >
            <div className="font-bold text-lg">JSON</div>
            <div className="text-xs font-normal opacity-80">{t('export.exportJsonDesc')}</div>
          </button>
          <button
            type="button"
            className="w-full primary-button bg-emerald-600 hover:bg-emerald-700 py-3"
            onClick={() => onExportDec(deck)}
          >
            <div className="font-bold text-lg">DEC (MTGO)</div>
            <div className="text-xs font-normal opacity-80">{t('export.exportDecDesc')}</div>
          </button>
          <button type="button" className="w-full mt-2 secondary-button py-2" onClick={onCancel}>
            {t('common.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}
