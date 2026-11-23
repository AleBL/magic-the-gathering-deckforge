import { useTranslation } from 'react-i18next';
import { LuCheck, LuInfo, LuX } from 'react-icons/lu';
import { DeckFormat } from '../../types/Deck';
import { DeckFormatType } from '../../types/enums';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useEscapeKey } from '../../hooks/useEscapeKey';

interface DeckSaveDialogProps {
  deckName: string;
  deckFormat: DeckFormat;
  onDeckNameChange: (name: string) => void;
  onDeckFormatChange: (format: DeckFormat) => void;
  onSave: () => void;
  onCancel: () => void;
  /** Heading override — defaults to "Save Deck"; reused for editing deck info. */
  title?: string;
}

const DECK_FORMATS: { value: DeckFormat; labelKey: string }[] = [
  { value: DeckFormatType.FREEFORM, labelKey: 'freeform' },
  { value: DeckFormatType.STANDARD, labelKey: 'standard' },
  { value: DeckFormatType.MODERN, labelKey: 'modern' },
  { value: DeckFormatType.COMMANDER, labelKey: 'commander' },
  { value: DeckFormatType.VINTAGE, labelKey: 'vintage' },
  { value: DeckFormatType.PAUPER, labelKey: 'pauper' }
];

function DeckSaveDialog({
  deckName,
  deckFormat,
  onDeckNameChange,
  onDeckFormatChange,
  onSave,
  onCancel,
  title
}: DeckSaveDialogProps) {
  const { t } = useTranslation();
  const dialogRef = useFocusTrap<HTMLDivElement>(true);
  useEscapeKey(onCancel);

  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="deck-save-title"
        className="modal-container modal-container-medium w-full flex flex-col !p-0 overflow-hidden animate-fadeIn mx-auto"
      >
        <div className="p-6 md:p-8 flex-1 overflow-y-auto flex flex-col">
          <h3 id="deck-save-title" className="text-xl font-semibold text-fg mb-4">
            {title ?? t('deck.saveDeck')}
          </h3>

          <div className="space-y-4 mb-6">
            <div>
              <label htmlFor="deck-name-input" className="form-label block mb-1 font-semibold text-fg-secondary">
                {t('deck.deckNamePlaceholder')}
              </label>
              <input
                id="deck-name-input"
                type="text"
                value={deckName}
                onChange={(e) => onDeckNameChange(e.target.value)}
                placeholder={t('deck.deckNamePlaceholder')}
                className="w-full px-4 py-2 border border-line-strong rounded-lg bg-surface-1 text-fg focus:ring-2 focus:ring-focus"
              />
            </div>

            <div>
              <span className="form-label block mb-1 font-semibold text-fg-secondary">{t('validation.format')}</span>
              <select
                value={deckFormat}
                onChange={(e) => onDeckFormatChange((e.target.value as DeckFormat) || DeckFormatType.FREEFORM)}
                className="w-full px-4 py-2 border border-line-strong rounded-lg bg-surface-1 text-fg focus:ring-2 focus:ring-focus"
              >
                {DECK_FORMATS.map((fmt) => (
                  <option key={fmt.value} value={fmt.value}>
                    {t(`validation.${fmt.labelKey}`)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 p-3 bg-accent-soft text-accent rounded-lg text-sm">
              <LuInfo className="shrink-0 mt-0.5" />
              <span>{t('validation.deckRulesExplanation')}</span>
            </div>
          </div>

          <div className="flex gap-3 pt-4 mt-auto border-t border-line">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 bg-surface-3 hover:bg-surface-3 text-fg rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <LuX />
              {t('common.cancel')}
            </button>
            <button
              type="button"
              onClick={onSave}
              className="flex-1 px-4 py-2 bg-primary hover:bg-primary-hover text-on-primary rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <LuCheck />
              {t('deck.save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DeckSaveDialog;
