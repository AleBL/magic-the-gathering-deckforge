import { useTranslation } from 'react-i18next';
import { FaCheck, FaTimes, FaInfoCircle } from 'react-icons/fa';
import { DeckFormat } from '../types/Deck';

interface DeckSaveDialogProps {
  deckName: string;
  deckFormat: DeckFormat;
  onDeckNameChange: (name: string) => void;
  onDeckFormatChange: (format: DeckFormat) => void;
  onSave: () => void;
  onCancel: () => void;
}

const DECK_FORMATS: { value: DeckFormat; labelKey: string }[] = [
  { value: 'freeform', labelKey: 'freeform' },
  { value: 'standard', labelKey: 'standard' },
  { value: 'modern', labelKey: 'modern' },
  { value: 'commander', labelKey: 'commander' },
  { value: 'vintage', labelKey: 'vintage' },
  { value: 'pauper', labelKey: 'pauper' }
];

function DeckSaveDialog({
  deckName,
  deckFormat,
  onDeckNameChange,
  onDeckFormatChange,
  onSave,
  onCancel
}: DeckSaveDialogProps) {
  const { t } = useTranslation();

  return (
    <div className="modal-overlay">
      <div className="modal-container modal-container-small">
        <h3 className="modal-title">{t('saveDeck')}</h3>

        <div className="space-y-4 mb-5">
          <div>
            <label htmlFor="deck-name-input" className="form-label">
              {t('deckNamePlaceholder')}
            </label>
            <input
              id="deck-name-input"
              type="text"
              value={deckName}
              onChange={(e) => onDeckNameChange(e.target.value)}
              placeholder={t('deckNamePlaceholder')}
              className="form-input"
            />
          </div>

          <div>
            <span className="form-label">{t('format')}</span>
            <select
              value={deckFormat}
              onChange={(e) => onDeckFormatChange((e.target.value as DeckFormat) || 'freeform')}
              className="form-select"
            >
              {DECK_FORMATS.map((fmt) => (
                <option key={fmt.value} value={fmt.value}>
                  {t(fmt.labelKey)}
                </option>
              ))}
            </select>
          </div>

          <div className="alert-banner-info">
            <FaInfoCircle className="text-blue-500 shrink-0 mt-0.5" />
            <span className="font-semibold">{t('deckRulesExplanation')}</span>
          </div>
        </div>

        <div className="modal-actions">
          <button type="button" onClick={onSave} className="success-button flex-1">
            <FaCheck className="text-sm" />
            {t('save')}
          </button>
          <button type="button" onClick={onCancel} className="secondary-button flex-1">
            <FaTimes className="text-sm" />
            {t('cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeckSaveDialog;
