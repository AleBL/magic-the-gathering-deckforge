import CardItem from './CardItem';
import { Card } from '../types/Card';
import { CardSize } from '../types';

interface CardGridProps {
  cards: Card[];
  size: CardSize;
  onAddToDeck?: (card: Card) => void;
  onRemoveFromDeck?: (card: Card) => void;
  showRemoveButton?: boolean;
}

const GRID_CLASSES: Record<CardSize, string> = {
  small: 'card-grid-small',
  medium: 'card-grid-medium',
  large: 'card-grid-large',
  xlarge: 'card-grid-xlarge'
};

function CardGrid({ cards, size, onAddToDeck, onRemoveFromDeck, showRemoveButton = false }: CardGridProps) {
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
          />
        </div>
      ))}
    </div>
  );
}

export default CardGrid;
