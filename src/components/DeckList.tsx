import { useTranslation } from 'react-i18next';
import { FaEdit, FaDownload, FaTrash } from 'react-icons/fa';
import { Deck, DeckFormat } from '../types/Deck';
import { validateDeck } from '../utils/deckValidator';
import DeckValidationBadge from './DeckValidationBadge';

interface DeckListProps {
  decks: Deck[];
  selectedDeckId: string | null;
  editingDeckId: string | null;
  onSelectDeck: (deck: Deck) => void;
  onEditDeck: (id: string, name: string, format: DeckFormat, cards: Deck['cards'], notes?: string) => void;
  onExportDeck: (deck: Deck) => void;
  onDeleteDeck: (deckId: string) => void;
}

function DeckList({
  decks,
  selectedDeckId,
  editingDeckId,
  onSelectDeck,
  onEditDeck,
  onExportDeck,
  onDeleteDeck
}: DeckListProps) {
  const { t } = useTranslation();

  return (
    <div className="deck-list-section">
      <h3 className="text-gray-900 dark:text-white text-xl font-bold mb-4 transition-colors duration-300">
        {t('savedDecks')} ({decks.length})
      </h3>
      <div className="space-y-2.5">
        {decks.length === 0 ? (
          <p className="text-muted">{t('noSavedDecks')}</p>
        ) : (
          decks.map((deck) => {
            const validation = validateDeck(deck.cards, deck.format || 'freeform');
            const isSelected = selectedDeckId === deck.id;
            const isEditing = editingDeckId === deck.id;

            return (
              <div
                key={deck.id}
                className={`deck-list-item relative overflow-hidden transition-all duration-300 transform border hover:translate-x-1.5 ${
                  isSelected
                    ? 'deck-list-item-active ring-2 ring-blue-500/30 bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-400'
                    : 'bg-white/80 dark:bg-gray-800/80 hover:bg-gray-200 dark:hover:bg-gray-700/80 border-gray-200 dark:border-gray-700 shadow-sm'
                }`}
              >
                {/* Subtle visual glow under selection */}
                {isSelected && <div className="absolute inset-0 bg-white/10 dark:bg-white/5 pointer-events-none" />}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
                  <button
                    type="button"
                    className="deck-list-item-button w-full text-left"
                    onClick={() => onSelectDeck(deck)}
                  >
                    <div className="flex items-center gap-2">
                      <p className="font-bold truncate text-sm sm:text-base">{deck.name}</p>
                      {isEditing && (
                        <span
                          className="shrink-0 inline-block w-2.5 h-2.5 bg-amber-400 border border-white dark:border-slate-800 rounded-full animate-ping"
                          title={t('editingDeck')}
                        />
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      <span className={`text-xs ${isSelected ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                        {deck.cards.length} {t('cards')}
                      </span>
                      <span
                        className={`format-badge text-[9px] px-2 py-0.5 rounded-full font-extrabold uppercase ${isSelected ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                      >
                        {t(deck.format || 'freeform')}
                      </span>
                      <DeckValidationBadge
                        validation={validation}
                        formatKey={deck.format || 'freeform'}
                        variant="compact"
                      />
                    </div>
                  </button>
                  <div className="flex gap-1.5 justify-end w-full sm:w-auto shrink-0 border-t sm:border-t-0 border-black/10 dark:border-white/10 pt-2 sm:pt-0">
                    <button
                      type="button"
                      onClick={() => onEditDeck(deck.id, deck.name, deck.format || 'freeform', deck.cards, deck.notes)}
                      className={`button-small flex-1 sm:flex-none justify-center gap-1 items-center py-1.5 px-2.5 rounded-lg font-bold text-xs shadow-sm transition-all ${
                        isSelected
                          ? 'bg-white/20 hover:bg-white/30 text-white border border-white/30'
                          : 'primary-button'
                      }`}
                      title={t('edit')}
                      aria-label={`${t('edit')} ${deck.name}`}
                    >
                      <FaEdit className="text-[10px]" />
                      <span className="sm:hidden text-[10px] font-bold uppercase">{t('edit')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onExportDeck(deck)}
                      className={`button-small flex-1 sm:flex-none justify-center gap-1 items-center py-1.5 px-2.5 rounded-lg font-bold text-xs shadow-sm transition-all ${
                        isSelected
                          ? 'bg-white/20 hover:bg-white/30 text-white border border-white/30'
                          : 'success-button'
                      }`}
                      title={t('export')}
                      aria-label={`${t('export')} ${deck.name}`}
                    >
                      <FaDownload className="text-[10px]" />
                      <span className="sm:hidden text-[10px] font-bold uppercase">{t('export')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteDeck(deck.id)}
                      className={`button-small flex-1 sm:flex-none justify-center gap-1 items-center py-1.5 px-2.5 rounded-lg font-bold text-xs shadow-sm transition-all ${
                        isSelected
                          ? 'bg-red-500/20 hover:bg-red-500/40 text-red-100 border border-red-500/30'
                          : 'danger-button text-xs'
                      }`}
                      title={t('delete')}
                      aria-label={`${t('delete')} ${deck.name}`}
                    >
                      <FaTrash className="text-[10px]" />
                      <span className="sm:hidden text-[10px] font-bold uppercase">{t('delete')}</span>
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
