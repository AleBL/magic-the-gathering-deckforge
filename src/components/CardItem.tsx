import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../types/Card';
import { CardSize } from '../types';
import CardDetailModal from './CardDetailModal';

interface CardItemProps {
  card: Card;
  size: CardSize;
  onAddToDeck?: (card: Card) => void;
  onRemoveFromDeck?: (card: Card) => void;
  showRemoveButton?: boolean;
}

function getCardImageUrl(card: Card, size: CardSize): string {
  const imageUris = card.image_uris ?? card.card_faces?.[0]?.image_uris;
  if (!imageUris) return '';

  if (card.image_uris?.gatherer) return card.image_uris.gatherer;

  const sizeToUriKey: Record<CardSize, keyof typeof imageUris> = {
    small: 'small',
    medium: 'normal',
    large: 'large',
    xlarge: 'png'
  };

  return imageUris[sizeToUriKey[size]] || '';
}

function CardItem({ card, size, onAddToDeck, onRemoveFromDeck, showRemoveButton = false }: CardItemProps) {
  const { t } = useTranslation();
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const imageUrl = useMemo(() => getCardImageUrl(card, size), [card, size]);

  return (
    <div className="card-item-wrapper group">
      <button
        type="button"
        onClick={() => setIsDetailOpen(true)}
        className="card-image-button"
        aria-label={card.name}
      >
        <img src={imageUrl} alt={card.name} className="card-image-content" loading="lazy" />
      </button>

      <div className="card-action-overlay">
        <p className="card-action-title">{card.name}</p>
        <div className="card-action-buttons">
          {onAddToDeck && (
            <button
              onClick={() => onAddToDeck(card)}
              className="success-button button-small flex-1"
            >
              {t('addToDeck')}
            </button>
          )}
          {showRemoveButton && onRemoveFromDeck && (
            <button
              onClick={() => onRemoveFromDeck(card)}
              className="danger-button button-small flex-1"
            >
              {t('remove')}
            </button>
          )}
        </div>
      </div>

      {isDetailOpen && (
        <CardDetailModal
          card={card}
          imageUrl={imageUrl}
          onAddToDeck={onAddToDeck}
          onClose={() => setIsDetailOpen(false)}
        />
      )}
    </div>
  );
}

export default CardItem;
