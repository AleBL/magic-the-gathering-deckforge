import { useTranslation } from 'react-i18next';
import { Deck } from '../../types/Deck';

interface DeckExportDialogProps {
  deck: Deck;
  onExportJson: (deck: Deck) => void;
  onExportDec: (deck: Deck) => void;
  onCancel: () => void;
}

/** Prompt asking which file format to export a deck as (JSON or .dec). */
export function DeckExportDialog({ deck, onExportJson, onExportDec, onCancel }: DeckExportDialogProps) {
  const { t } = useTranslation();

  return (
    <div className="modal-overlay z-[var(--z-overlay)]">
      <div className="modal-container w-full animate-fadeIn">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
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
