import { useTranslation } from 'react-i18next';
import { FaEdit, FaTimes, FaFileAlt } from 'react-icons/fa';
import { Card } from '../types/Card';
import { Deck, DeckFormat } from '../types/Deck';
import { CardSize } from '../types';
import { validateDeck } from '../utils/deckValidator';
import CardGrid from './CardGrid';
import DeckValidationBadge from './DeckValidationBadge';

interface DeckPreviewProps {
  selectedDeck: Deck | null;
  currentDeck: Card[];
  cardSize: CardSize;
  editingDeckId: string | null;
  onLoadDeckToEdit: (id: string, name: string, format: DeckFormat, cards: Card[]) => void;
  onDeselectDeck: () => void;
  onRemoveFromDeck: (card: Card) => void;
}

function DeckPreview({
  selectedDeck,
  currentDeck,
  cardSize,
  editingDeckId,
  onLoadDeckToEdit,
  onDeselectDeck,
  onRemoveFromDeck
}: DeckPreviewProps) {
  const { t } = useTranslation();

  if (selectedDeck) {
    const validation = validateDeck(selectedDeck.cards, selectedDeck.format || 'freeform');

    return (
      <div className="deck-preview-section">
        <div className="panel-header">
          <div>
            <h3 className="text-gray-900 dark:text-white text-xl font-bold transition-colors duration-300 flex items-center gap-2">
              <FaFileAlt className="text-blue-600 shrink-0" />
              {selectedDeck.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-muted">
                {t('format')}:{' '}
                <span className="font-semibold text-gray-800 dark:text-gray-200">
                  {t(selectedDeck.format || 'freeform')}
                </span>
              </span>
              <span className="text-muted">•</span>
              <span className="text-muted">
                {selectedDeck.cards.length} {t('cards')}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                onLoadDeckToEdit(
                  selectedDeck.id,
                  selectedDeck.name,
                  selectedDeck.format || 'freeform',
                  selectedDeck.cards
                );
              }}
              className="primary-button text-sm"
            >
              <FaEdit className="text-xs shrink-0" />
              {t('edit')}
            </button>
            <button
              type="button"
              onClick={onDeselectDeck}
              className="secondary-button text-sm"
            >
              <FaTimes className="text-xs shrink-0" />
              {t('cancel')}
            </button>
          </div>
        </div>

        <div className="mb-4">
          <DeckValidationBadge validation={validation} formatKey={selectedDeck.format || 'freeform'} />
        </div>

        <CardGrid cards={selectedDeck.cards} size={cardSize} showRemoveButton={false} />
      </div>
    );
  }

  return (
    <div className="deck-preview-section">
      <div className="panel-header">
        <h3 className="text-gray-900 dark:text-white text-xl font-semibold transition-colors duration-300">
          {t('currentDeck')} {editingDeckId && `(${t('editingDeck')})`}
        </h3>
        {editingDeckId && (
          <span className="active-edit-badge">
            ⚡ {t('activeEditingMode')}
          </span>
        )}
      </div>
      {currentDeck.length === 0 ? (
        <p className="text-muted">
          {t('addCardsMessage')}
        </p>
      ) : (
        <CardGrid cards={currentDeck} size={cardSize} onRemoveFromDeck={onRemoveFromDeck} showRemoveButton />
      )}
    </div>
  );
}

export default DeckPreview;
