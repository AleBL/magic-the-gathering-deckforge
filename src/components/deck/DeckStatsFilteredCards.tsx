import React from 'react';
import { Card } from '../../types/Card';
import { Deck, DeckFormat } from '../../types/Deck';
import { CardSize } from '../../types';
import { DeckZone, GroupCriteria, SortCriteria } from '../../types/enums';
import { groupCards } from '../../utils/deckGrouping';
import { ViewMode } from '../../hooks/useDeckPreviewState';
import DeckStackView from './DeckStackView';
import DeckCardList from './DeckCardList';

interface DeckStatsFilteredCardsProps {
  filteredCards: Card[];
  selectedDeck: Deck | null;
  activeFormat?: DeckFormat;
  viewMode: ViewMode;
  groupBy: GroupCriteria;
  sortBy: SortCriteria;
  cardSize: CardSize;
  commanders: Card[];
  onHoverEnter: (card: Card, e: React.MouseEvent) => void;
  onHoverMove: (e: React.MouseEvent) => void;
  onHoverLeave: () => void;
  onRemoveFromDeck: (card: Card) => void;
  onAddToDeck: (card: Card) => void;
  onAddTokenToDeck?: (token: Card) => void;
  onToggleCommander: (card: Card) => void;
  onUpdateCard?: (updatedCard: Card) => void;
  onUpdateCardZone?: (cardId: string, zone: DeckZone) => void;
}

/** Renders the subset of cards matching an active DeckStats filter, as stack or list. */
export function DeckStatsFilteredCards({
  filteredCards,
  selectedDeck,
  activeFormat,
  viewMode,
  groupBy,
  sortBy,
  cardSize,
  commanders,
  onHoverEnter,
  onHoverMove,
  onHoverLeave,
  onRemoveFromDeck,
  onAddToDeck,
  onAddTokenToDeck,
  onToggleCommander,
  onUpdateCard,
  onUpdateCardZone
}: DeckStatsFilteredCardsProps) {
  return (
    <div className="mt-4">
      {viewMode === 'stack' ? (
        <DeckStackView
          groups={groupCards(filteredCards, groupBy, sortBy)}
          cardSize={cardSize}
          isRemovable={false}
          activeFormat={selectedDeck?.format || activeFormat}
          onHoverEnter={onHoverEnter}
          onHoverMove={onHoverMove}
          onHoverLeave={onHoverLeave}
          onRemoveFromDeck={onRemoveFromDeck}
          onAddToDeck={onAddToDeck}
          onAddTokenToDeck={onAddTokenToDeck}
          onUpdateCard={onUpdateCard}
          onUpdateCardZone={onUpdateCardZone}
        />
      ) : (
        <DeckCardList
          groups={groupCards(filteredCards, groupBy, sortBy)}
          commanders={commanders.filter((c) => filteredCards.some((f) => f.id === c.id))}
          cardSize={cardSize}
          viewMode={viewMode}
          isRemovable={false}
          isTokenZone={false}
          activeFormat={selectedDeck ? selectedDeck.format : activeFormat}
          onUpdateCardZone={onUpdateCardZone}
          onAddToDeck={onAddToDeck}
          onAddTokenToDeck={onAddTokenToDeck}
          onRemoveFromDeck={onRemoveFromDeck}
          onToggleCommander={onToggleCommander}
          onHoverEnter={onHoverEnter}
          onHoverMove={onHoverMove}
          onHoverLeave={onHoverLeave}
        />
      )}
    </div>
  );
}
