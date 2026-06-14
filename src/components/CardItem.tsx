import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FaCrown, FaBan, FaExclamationTriangle } from 'react-icons/fa';
import { Card } from '../types/Card';
import { CardSize } from '../types';
import { DeckFormat } from '../types/Deck';
import CardDetailModal from './CardDetailModal';
import locales from '../locales';

const getBasicLandNamesMap = (): Record<string, string> => {
  const map: Record<string, string> = {};
  const landKeys = ['plains', 'island', 'swamp', 'mountain', 'forest', 'wastes'];

  landKeys.forEach((key) => {
    map[key] = key;
  });

  Object.values(locales).forEach((locale) => {
    const translations = locale.translations;
    if (translations) {
      landKeys.forEach((key) => {
        const translatedName = translations[key as keyof typeof translations];
        if (typeof translatedName === 'string') {
          map[translatedName.toLowerCase()] = key;
        }
      });
    }
  });

  return map;
};

const BASIC_LAND_NAMES = getBasicLandNamesMap();

interface CardItemProps {
  card: Card;
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
}

function getCardImageUrl(card: Card, size: CardSize): string {
  if (card.selectedPrintImageUri) return card.selectedPrintImageUri;

  const imageUris = card.image_uris ?? card.card_faces?.[0]?.image_uris;
  if (!imageUris) {
    const landName = BASIC_LAND_NAMES[card.name?.toLowerCase()];
    return landName ? `https://api.scryfall.com/cards/named?exact=${landName}&format=image` : '';
  }

  if (card.image_uris?.gatherer) return card.image_uris.gatherer;

  const sizeToUriKey: Record<CardSize, keyof typeof imageUris> = {
    small: 'small',
    medium: 'normal',
    large: 'large',
    xlarge: 'png'
  };

  const prioritizedUri = imageUris[sizeToUriKey[size]];
  if (prioritizedUri) return prioritizedUri;

  const landName = BASIC_LAND_NAMES[card.name?.toLowerCase()];
  return landName ? `https://api.scryfall.com/cards/named?exact=${landName}&format=image` : '';
}

function CardItem({
  card,
  size,
  onAddToDeck,
  onAddTokenToDeck,
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
    <div
      className={`card-item-wrapper group relative ${isBanned ? 'border-red-500/50' : ''} ${isToken && card.isActive === false ? 'opacity-75' : ''}`}
    >
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

      {isToken && card.isActive === false && (
        <div className="absolute top-2 left-2 z-10 bg-slate-800/95 dark:bg-slate-900/95 backdrop-blur-sm text-slate-350 dark:text-slate-400 px-2 py-0.5 rounded-md text-[9px] font-extrabold shadow-md border border-slate-700/60 flex items-center gap-1 select-none">
          <span className="w-1 h-1 rounded-full bg-slate-400" />
          {(t('inactive') || 'Inativo').toUpperCase()}
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
            isToken && card.isActive === false
              ? 'opacity-40 grayscale-[40%] brightness-[75%] shadow-[0_0_10px_rgba(30,41,59,0.3)] rounded-lg'
              : isBanned
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
          onAddTokenToDeck={onAddTokenToDeck}
          onClose={() => setIsDetailOpen(false)}
          onSelectPrint={onSelectPrint}
          isToken={isToken}
          isDeckCard={isDeckCard}
          deckCards={deckCards}
          onRemoveFromDeck={onRemoveFromDeck}
          isEditMode={isEditMode}
          deckRelatedTokens={isToken ? deckCards.map((c) => ({ tokenCard: c, generatorCardName: '' })) : undefined}
        />
      )}
    </div>
  );
}

export default CardItem;
