import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LuLayers, LuSearch } from 'react-icons/lu';
import { Deck, DeckFormat } from '../../types/Deck';
import { DeckListItem } from '../deck/DeckListItem';

type DeckSort = 'recent' | 'name' | 'format';

/** Below this many decks the list fits at a glance and the tools would be noise. */
const TOOLS_FROM = 5;

function sortDecks(decks: Deck[], sort: DeckSort): Deck[] {
  const copy = [...decks];
  if (sort === 'name') return copy.sort((a, b) => a.name.localeCompare(b.name));
  if (sort === 'format')
    return copy.sort((a, b) => (a.format ?? '').localeCompare(b.format ?? '') || a.name.localeCompare(b.name));
  return copy.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

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
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<DeckSort>('recent');
  const showTools = decks.length >= TOOLS_FROM;

  const visibleDecks = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matching = needle ? decks.filter((deck) => deck.name.toLowerCase().includes(needle)) : decks;
    return sortDecks(matching, sort);
  }, [decks, query, sort]);

  return (
    <div className="deck-list-section">
      {hideHeading ? null : (
        // Below lg the "Saved decks" toggle above the list already names it.
        <h3 className="hidden lg:block text-fg text-xl font-semibold mb-4">
          {t('deck.savedDecks')} ({decks.length})
        </h3>
      )}
      {showTools && (
        <div className="mb-3 flex items-center gap-2">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">{t('deck.searchDecks')}</span>
            <LuSearch className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-fg-muted" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('deck.searchDecks')}
              className="h-9 w-full rounded-lg border border-line-strong bg-surface-1 pl-8 pr-2 text-sm text-fg placeholder:text-fg-muted"
            />
          </label>
          <label className="shrink-0">
            <span className="sr-only">{t('deck.sortDecks')}</span>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as DeckSort)}
              className="h-9 rounded-lg border border-line-strong bg-surface-1 px-2 text-sm text-fg cursor-pointer"
            >
              <option value="recent">{t('deck.sortRecent')}</option>
              <option value="name">{t('deck.sortName')}</option>
              <option value="format">{t('deck.sortFormat')}</option>
            </select>
          </label>
        </div>
      )}
      {/* `column` is the sidebar lane at lg+, but below lg the same list expands to the full
          page width behind the "Saved decks" toggle. One full-width column there made each
          4:3 cover ~450-750px tall — most of the viewport for a single deck — so it pairs up
          in the middle range and only returns to a single lane once it is a narrow sidebar. */}
      <div
        className={
          layout === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3'
            : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-1.5'
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
        ) : visibleDecks.length === 0 ? (
          <p className="py-6 text-center text-sm text-fg-muted">{t('deck.noDecksMatch')}</p>
        ) : (
          visibleDecks.map((deck) => (
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
