import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FaCrown, FaBan, FaExclamationTriangle } from 'react-icons/fa';
import { Card } from '../types/Card';
import { CardSize } from '../types';
import { DeckFormat } from '../types/Deck';
import CardDetailModal from './CardDetailModal';

interface CardItemProps {
  card: Card;
  size: CardSize;
  onAddToDeck?: (card: Card) => void;
  onRemoveFromDeck?: (card: Card) => void;
  showRemoveButton?: boolean;
  activeFormat?: DeckFormat;
  isDeckCard?: boolean;
  deckCards?: Card[];
  onSelectPrint?: (updatedCard: Card) => void;
  isToken?: boolean;
  isEditMode?: boolean;
}

const BASIC_LAND_FALLBACK_IMAGES: Record<string, string> = {
  plains: 'https://cards.scryfall.io/normal/front/a/e/ae53a152-4043-424d-9050-8b186f982829.jpg',
  island: 'https://cards.scryfall.io/normal/front/1/c/1c84cb13-43ef-4d37-84ec-86cffcd14984.jpg',
  swamp: 'https://cards.scryfall.io/normal/front/2/a/2ae68e9f-7df8-43d9-a78b-49ef4599c9c8.jpg',
  mountain: 'https://cards.scryfall.io/normal/front/0/e/0efad862-2ee7-4a0b-93ff-1830491fb342.jpg',
  forest: 'https://cards.scryfall.io/normal/front/5/4/5446059d-47fe-493e-8120-cfbc11d29377.jpg',
  wastes: 'https://cards.scryfall.io/normal/front/0/3/036c84c1-6b45-4424-aa61-5991d7c35fa9.jpg',
  planície: 'https://cards.scryfall.io/normal/front/a/e/ae53a152-4043-424d-9050-8b186f982829.jpg',
  ilha: 'https://cards.scryfall.io/normal/front/1/c/1c84cb13-43ef-4d37-84ec-86cffcd14984.jpg',
  pântano: 'https://cards.scryfall.io/normal/front/2/a/2ae68e9f-7df8-43d9-a78b-49ef4599c9c8.jpg',
  montanha: 'https://cards.scryfall.io/normal/front/0/e/0efad862-2ee7-4a0b-93ff-1830491fb342.jpg',
  floresta: 'https://cards.scryfall.io/normal/front/5/4/5446059d-47fe-493e-8120-cfbc11d29377.jpg'
};

function getCardImageUrl(card: Card, size: CardSize): string {
  if (card.selectedPrintImageUri) return card.selectedPrintImageUri;

  const imageUris = card.image_uris ?? card.card_faces?.[0]?.image_uris;
  if (!imageUris) {
    // Fallback for basic lands without image_uris (pre-existing decks)
    return BASIC_LAND_FALLBACK_IMAGES[card.name?.toLowerCase()] || '';
  }

  if (card.image_uris?.gatherer) return card.image_uris.gatherer;

  const sizeToUriKey: Record<CardSize, keyof typeof imageUris> = {
    small: 'small',
    medium: 'normal',
    large: 'large',
    xlarge: 'png'
  };

  return imageUris[sizeToUriKey[size]] || BASIC_LAND_FALLBACK_IMAGES[card.name?.toLowerCase()] || '';
}

function CardItem({
  card,
  size,
  onAddToDeck,
  onRemoveFromDeck,
  showRemoveButton = false,
  activeFormat,
  isDeckCard = false,
  deckCards = [],
  onSelectPrint,
  isToken = false,
  isEditMode = false
}: CardItemProps) {
  const { t } = useTranslation();
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const imageUrl = useMemo(() => getCardImageUrl(card, size), [card, size]);

  const isBanned = useMemo(() => {
    if (!activeFormat || activeFormat === 'freeform') return false;
    return card.legalities?.[activeFormat as keyof typeof card.legalities] === 'banned';
  }, [card, activeFormat]);

  const isRestricted = useMemo(() => {
    if (!activeFormat || activeFormat === 'freeform') return false;
    return card.legalities?.[activeFormat as keyof typeof card.legalities] === 'restricted';
  }, [card, activeFormat]);

  return (
    <div className={`card-item-wrapper group relative ${isBanned ? 'border-red-500/50' : ''}`}>
      {card.isCommander && (
        <div className="absolute top-2 left-2 z-10 bg-amber-500/90 dark:bg-amber-600/90 backdrop-blur-sm text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow-lg border border-amber-400 flex items-center gap-1 animate-pulse select-none">
          <FaCrown className="text-amber-200 text-xs shrink-0 animate-pulse" />
          {t('commanderBadge') || 'Comandante'}
        </div>
      )}

      {isBanned && (
        <div className="absolute top-2 right-2 z-10 bg-rose-600/90 dark:bg-rose-700/90 backdrop-blur-sm text-white px-2.5 py-0.5 rounded-full text-[9px] font-bold shadow-lg border border-rose-500 flex items-center gap-1 select-none">
          <FaBan className="text-white text-[9px] shrink-0 animate-spin-slow" />
          {t('banned') || 'Banida'}
        </div>
      )}

      {isRestricted && (
        <div className="absolute top-2 right-2 z-10 bg-amber-500/90 dark:bg-amber-600/90 backdrop-blur-sm text-white px-2.5 py-0.5 rounded-full text-[9px] font-bold shadow-lg border border-amber-400 flex items-center gap-1 select-none">
          <FaExclamationTriangle className="text-white text-[9px] shrink-0" />
          {t('restricted') || 'Restrita'}
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsDetailOpen(true)}
        className="card-image-button animate-fadeIn"
        aria-label={card.name}
      >
        <img
          src={imageUrl}
          alt={card.name}
          className={`card-image-content transition-all duration-300 ${
            isBanned
              ? 'opacity-50 grayscale-[40%] brightness-[75%] border-2 border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)] rounded-lg'
              : isRestricted
                ? 'border-2 border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.4)] rounded-lg'
                : ''
          }`}
          loading="lazy"
        />
      </button>

      <div className={`card-action-overlay ${isBanned ? 'bg-red-950/80' : ''}`}>
        <p className="card-action-title flex items-center justify-center gap-1">
          {isBanned && <FaBan className="text-red-400 text-xs inline shrink-0" />}
          {card.name}
        </p>
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
          onSelectPrint={onSelectPrint}
          isToken={isToken}
          isDeckCard={isDeckCard}
          deckCards={deckCards}
          onRemoveFromDeck={onRemoveFromDeck}
          isEditMode={isEditMode}
        />
      )}
    </div>
  );
}

export default CardItem;
