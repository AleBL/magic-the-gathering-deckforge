import CardItem from './CardItem';
import { Card } from '../types/Card';
import { CardSize } from '../types';
import { DeckFormat } from '../types/Deck';

interface CardGridProps {
  cards: Card[];
  size: CardSize;
  onAddToDeck?: (card: Card) => void;
  onRemoveFromDeck?: (card: Card) => void;
  showRemoveButton?: boolean;
  activeFormat?: DeckFormat;
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
  onRemoveFromDeck,
  showRemoveButton = false,
  activeFormat
}: CardGridProps) {
  return (
    <div className={GRID_CLASSES[size]}>
      {cards.map((card) => (
        <div key={card.id} className="animate-fadeIn">
          <CardItem
            card={card}
            size={size}
            onAddToDeck={onAddToDeck}
            onRemoveFromDeck={onRemoveFromDeck}
            showRemoveButton={showRemoveButton}
            activeFormat={activeFormat}
          />
        </div>
      ))}
    </div>
  );
}

export default CardGrid;
