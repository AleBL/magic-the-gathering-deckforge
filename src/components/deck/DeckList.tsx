import { useTranslation } from 'react-i18next';
import { LuLayers } from 'react-icons/lu';
import { Deck, DeckFormat } from '../../types/Deck';
import { DeckListItem } from '../deck/DeckListItem';

export interface DeckListProps {
  decks: Deck[];
  selectedDeckId: string | null;
  editingDeckId: string | null;
  onSelectDeck: (deck: Deck) => void;
  /** Double-click / Enter: select and commit. The all-decks modal closes itself with it. */
  onActivateDeck?: (deck: Deck) => void;
  onEditDeck: (
    id: string,
    name: string,
    format: DeckFormat,
    cards: Deck['cards'],
    notes?: string,
    relatedTokens?: Deck['relatedTokens']
  ) => void;
  onExportDeck: (deck: Deck) => void;
  onDuplicateDeck: (deck: Deck) => void;
  onNewFromDeck: (deck: Deck) => void;
  onDeleteDeck: (deck: Deck) => void;
  onChangeCover: (deck: Deck) => void;
  /** `column` for the 300px sidebar lane; `grid` for the all-decks modal. */
  layout?: 'column' | 'grid';
  /** The modal supplies its own dialog title, so the list's heading would repeat it. */
  hideHeading?: boolean;
}

function DeckList({
  decks,
  selectedDeckId,
  editingDeckId,
  onSelectDeck,
  onActivateDeck,
  onEditDeck,
  onExportDeck,
  onDuplicateDeck,
  onNewFromDeck,
  onDeleteDeck,
  onChangeCover,
  layout = 'column',
  hideHeading = false
}: DeckListProps) {
  const { t } = useTranslation();

  return (
    <div className="deck-list-section">
      {hideHeading ? null : (
        <h3 className="text-fg text-xl font-semibold mb-4 transition-colors duration-300">
          {t('deck.savedDecks')} ({decks.length})
        </h3>
      )}
      {/* `column` is the sidebar lane at lg+, but below lg the same list expands to the full
          page width behind the "Saved decks" toggle. One full-width column there made each
          4:3 cover ~450-750px tall — most of the viewport for a single deck — so it pairs up
          in the middle range and only returns to a single lane once it is a narrow sidebar. */}
      <div
        className={
          layout === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3'
            : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5'
        }
      >
        {decks.length === 0 ? (
          <div className="empty-deck-list-state group">
            <div className="empty-deck-list-state-bg" />
            <div className="empty-deck-list-state-icon-wrapper">
              <LuLayers className="text-xl text-accent" />
            </div>
            <p className="text-sm font-semibold text-fg mb-1">{t('deck.noSavedDecks')}</p>
            <p className="text-xs text-fg-muted">{t('deck.addCardsMessage')}</p>
          </div>
        ) : (
          decks.map((deck) => (
            <DeckListItem
              key={deck.id}
              deck={deck}
              isSelected={selectedDeckId === deck.id}
              isEditing={editingDeckId === deck.id}
              onSelect={onSelectDeck}
              onActivate={onActivateDeck}
              onEdit={onEditDeck}
              onExport={onExportDeck}
              onDuplicate={onDuplicateDeck}
              onNewFrom={onNewFromDeck}
              onDelete={onDeleteDeck}
              onChangeCover={onChangeCover}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default DeckList;
