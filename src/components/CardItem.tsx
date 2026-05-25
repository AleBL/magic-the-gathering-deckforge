import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FaCrown } from 'react-icons/fa';
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
    <div className="card-item-wrapper group relative">
      {card.isCommander && (
        <div className="absolute top-2 left-2 z-10 bg-amber-500/90 dark:bg-amber-600/90 backdrop-blur-sm text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow-lg border border-amber-400 flex items-center gap-1 animate-pulse select-none">
          <FaCrown className="text-amber-200 text-xs shrink-0 animate-pulse" />
          {t('commanderBadge') || 'Comandante'}
        </div>
      )}
      <button type="button" onClick={() => setIsDetailOpen(true)} className="card-image-button" aria-label={card.name}>
        <img src={imageUrl} alt={card.name} className="card-image-content" loading="lazy" />
      </button>

      <div className="card-action-overlay">
        <p className="card-action-title">{card.name}</p>
        <div className="card-action-buttons">
          {onAddToDeck && (
            <button onClick={() => onAddToDeck(card)} className="success-button button-small flex-1">
              {t('addToDeck')}
            </button>
          )}
          {showRemoveButton && onRemoveFromDeck && (
            <button onClick={() => onRemoveFromDeck(card)} className="danger-button button-small flex-1">
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
