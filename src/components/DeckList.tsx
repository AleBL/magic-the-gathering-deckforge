import { useTranslation } from 'react-i18next';
import { FaEdit, FaDownload, FaTrash } from 'react-icons/fa';
import { Deck, DeckFormat } from '../types/Deck';
import { validateDeck } from '../utils/deckValidator';
import DeckValidationBadge from './DeckValidationBadge';

interface DeckListProps {
  decks: Deck[];
  selectedDeckId: string | null;
  onSelectDeck: (deck: Deck) => void;
  onEditDeck: (id: string, name: string, format: DeckFormat, cards: Deck['cards']) => void;
  onExportDeck: (deck: Deck) => void;
  onDeleteDeck: (deckId: string) => void;
}

function DeckList({ decks, selectedDeckId, onSelectDeck, onEditDeck, onExportDeck, onDeleteDeck }: DeckListProps) {
  const { t } = useTranslation();

  return (
    <div className="deck-list-section">
      <h3 className="text-gray-900 dark:text-white text-xl font-semibold mb-4 transition-colors duration-300">
        {t('savedDecks')} ({decks.length})
      </h3>
      <div className="space-y-2">
        {decks.length === 0 ? (
          <p className="text-muted">{t('noSavedDecks')}</p>
        ) : (
          decks.map((deck) => {
            const validation = validateDeck(deck.cards, deck.format || 'freeform');
            return (
              <div
                key={deck.id}
                className={`deck-list-item ${
                  selectedDeckId === deck.id ? 'deck-list-item-active' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    className="deck-list-item-button"
                    onClick={() => onSelectDeck(deck)}
                  >
                    <p className="font-semibold truncate text-sm sm:text-base">{deck.name}</p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <span className="text-xs opacity-75">
                        {deck.cards.length} {t('cards')}
                      </span>
                      <span className="format-badge">
                        {t(deck.format || 'freeform')}
                      </span>
                      <DeckValidationBadge
                        validation={validation}
                        formatKey={deck.format || 'freeform'}
                        variant="compact"
                      />
                    </div>
                  </button>
                  <div className="flex gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => onEditDeck(deck.id, deck.name, deck.format || 'freeform', deck.cards)}
                      className="primary-button button-small"
                      title={t('edit')}
                      aria-label={`${t('edit')} ${deck.name}`}
                    >
                      <FaEdit className="text-[10px]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onExportDeck(deck)}
                      className="success-button button-small"
                      title={t('export')}
                      aria-label={`${t('export')} ${deck.name}`}
                    >
                      <FaDownload className="text-[10px]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteDeck(deck.id)}
                      className="danger-button button-small"
                      title={t('delete')}
                      aria-label={`${t('delete')} ${deck.name}`}
                    >
                      <FaTrash className="text-[10px]" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default DeckList;
