import { memo } from 'react';
import CardItem from './CardItem';
import { DeckZone } from '../../types/enums';
import { Card } from '../../types/Card';
import { CardSize } from '../../types';
import { DeckFormat } from '../../types/Deck';

interface CardGridProps {
  cards: Card[];
  size: CardSize;
  onAddToDeck?: (card: Card) => void;
  onAddTokenToDeck?: (token: Card) => void;
  onRemoveFromDeck?: (card: Card) => void;
  showRemoveButton?: boolean;
  activeFormat?: DeckFormat;
  isDeckCard?: boolean;
  deckCards?: Card[];
  onSelectPrint?: (updatedCard: Card) => void;
  isToken?: boolean;
  isEditMode?: boolean;
  onUpdateCardZone?: (cardId: string, zone: DeckZone) => void;
}

const GRID_CLASSES: Record<CardSize, string> = {
  small: 'card-grid-small',
  medium: 'card-grid-medium',
  large: 'card-grid-large',
  xlarge: 'card-grid-xlarge'
};

function CardGrid({
  cards,
  size,
  onAddToDeck,
  onAddTokenToDeck,
  onRemoveFromDeck,
  showRemoveButton = false,
  activeFormat,
  isDeckCard,
  deckCards,
  onSelectPrint,
  isToken,
  isEditMode,
  onUpdateCardZone
}: CardGridProps) {
  return (
    <div className={GRID_CLASSES[size]}>
      {cards.map((card) => (
        <div key={card.id} className="animate-fadeIn">
          <CardItem
            card={card}
            size={size}
            onAddToDeck={onAddToDeck}
            onAddTokenToDeck={onAddTokenToDeck}
            onRemoveFromDeck={onRemoveFromDeck}
            showRemoveButton={showRemoveButton}
            activeFormat={activeFormat}
            isDeckCard={isDeckCard}
            deckCards={deckCards}
            onSelectPrint={onSelectPrint}
            isToken={isToken}
            isEditMode={isEditMode}
            onUpdateCardZone={onUpdateCardZone}
          />
        </div>
      ))}
    </div>
  );
}

export default memo(CardGrid);
