import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FaCopy, FaLink, FaFileCode } from 'react-icons/fa';
import { Deck } from '../../types/Deck';
import { ShowToastFn } from '../../types/Toast';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { useSwipeToClose } from '../../hooks/useSwipeToClose';
import { buildDeckFileContent, buildShareUrl } from '../../services/deckShare';
import { deckToArenaText } from '../../utils/deckText';
import { downloadAsText } from '../../services/fileDownload';

interface DeckExportDialogProps {
  deck: Deck;
  onExportJson: (deck: Deck) => void;
  onExportDec: (deck: Deck) => void;
  onCancel: () => void;
  showToast: ShowToastFn;
}

/** Prompt offering every way to export/share a deck: link, text, files. */
export function DeckExportDialog({ deck, onExportJson, onExportDec, onCancel, showToast }: DeckExportDialogProps) {
  const { t } = useTranslation();
  const dialogRef = useFocusTrap<HTMLDivElement>(true);
  useEscapeKey(onCancel);
  const { onTouchStart, onTouchMove, onTouchEnd, panelStyle } = useSwipeToClose<HTMLDivElement>(onCancel);

  const shareUrl = useMemo(() => buildShareUrl(deck), [deck]);

  const copyToClipboard = async (text: string, successKey: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(t(successKey), 'success');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      showToast(t('common.unexpectedError'), 'error');
    }
  };

  const handleCopyLink = () => copyToClipboard(shareUrl, 'export.linkCopied');
  const handleCopyText = () => copyToClipboard(deckToArenaText(deck.cards), 'strategy.exportArenaCopied');
  const handleDownloadDeckFile = () =>
    downloadAsText(buildDeckFileContent(deck), `${deck.name.replace(/\s+/g, '_')}.deck`);

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
        style={panelStyle}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Grab handle: purely a visual affordance now — drag-to-close works
            from anywhere on the sheet (see useSwipeToClose), not just here. */}
        <div className="sm:hidden -mt-6 -mx-6 mb-4 flex justify-center pt-2.5 pb-1" aria-hidden="true">
          <div className="w-10 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>
        <h3 id="deck-export-dialog-title" className="text-xl font-bold text-slate-900 dark:text-white mb-1">
          {t('deck.export')} {deck.name}
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">{t('export.exportFormatPrompt')}</p>

        {/* Share section: link + QR to move the deck to another device, no backend. */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 mb-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
            {t('export.shareTitle')}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{t('export.shareLinkDesc')}</p>
          <div className="flex items-center gap-2 mb-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              aria-label={t('export.shareLink')}
              onFocus={(e) => e.currentTarget.select()}
              className="flex-1 min-w-0 rounded-lg bg-slate-100 dark:bg-slate-900/60 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 font-mono"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className="button-small deck-list-action-btn bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 px-3 py-2 shrink-0"
              title={t('export.copyLink')}
            >
              <FaLink className="text-xs" />
              <span className="text-xs font-bold">{t('common.copy')}</span>
            </button>
          </div>
          <button
            type="button"
            onClick={handleDownloadDeckFile}
            className="w-full secondary-button py-2 flex items-center justify-center gap-2 text-sm"
            title={t('export.downloadDeckFile')}
          >
            <FaFileCode className="text-xs" />
            {t('export.downloadDeckFile')}
          </button>
        </div>

        {/* Copy as plain decklist text (MTG Arena / MTGO). */}
        <button
          type="button"
          className="w-full mb-3 secondary-button py-2.5 flex items-center justify-center gap-2"
          onClick={handleCopyText}
        >
          <FaCopy className="text-sm" />
          <span className="font-bold text-sm">{t('export.copyText')}</span>
        </button>

        {/* File downloads. */}
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
          <button type="button" className="w-full mt-1 secondary-button py-2" onClick={onCancel}>
            {t('common.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}
