import { ReactNode, useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { FaTimes, FaSync } from 'react-icons/fa';
import { Card } from '../../types/Card';
import { useCardPrints } from '../../hooks/useCardPrints';
import { useCardRelatedTokensForCard } from '../../hooks/useCardRelatedTokens';
import { getCardImageUrl } from '../../utils/deckGrouping';
import { DeckRelatedToken } from '../../types/Deck';

interface CardDetailModalProps {
  card: Card;
  imageUrl: string;
  onAddToDeck?: (card: Card) => void;
  onAddTokenToDeck?: (token: Card) => void;
  onClose: () => void;
  onSelectPrint?: (updatedCard: Card) => void;
  isToken?: boolean;
  isDeckCard?: boolean;
  deckCards?: Card[];
  onRemoveFromDeck?: (card: Card) => void;
  isEditMode?: boolean;
  hidePrintsSidebar?: boolean;
  hidePriceAndLegality?: boolean;
  deckRelatedTokens?: DeckRelatedToken[];
  defaultShowPrints?: boolean;
  zIndex?: number;
}

import { CardDetailActions } from './CardDetailActions';
import { CardDetailData } from './CardDetailData';
import { CardDetailEditControls } from './CardDetailEditControls';
import { CardDetailPrintsSidebar } from './CardDetailPrintsSidebar';
import { CardDetailRelatedTokens } from './CardDetailRelatedTokens';

function CardDetailModal({
  card: initialCard,
  imageUrl,
  onAddToDeck,
  onAddTokenToDeck,
  onClose,
  onSelectPrint,
  isToken = false,
  isDeckCard = false,
  deckCards = [],
  onRemoveFromDeck,
  isEditMode = false,
  hidePrintsSidebar = false,
  hidePriceAndLegality = false,
  deckRelatedTokens = [],
  defaultShowPrints,
  zIndex = 200
}: CardDetailModalProps) {
  const { t } = useTranslation();
  const [card, setCard] = useState<Card>(initialCard);
  const [currentImageUrl, setCurrentImageUrl] = useState<string>(imageUrl);
  const { prints, isLoading: isPrintsLoading } = useCardPrints(card, undefined, isToken);
  const [hoveredImageUrl, setHoveredImageUrl] = useState<string | null>(null);
  const [showPrintsSidebar, setShowPrintsSidebar] = useState(
    defaultShowPrints !== undefined ? defaultShowPrints : !isDeckCard && !hidePrintsSidebar
  );

  // Sync card state when initialCard or imageUrl changes from parent
  useEffect(() => {
    setCard(initialCard);
    setCurrentImageUrl(imageUrl);
  }, [initialCard.id, imageUrl]);

  const copiesCount = useMemo(() => {
    if (!isDeckCard) return 0;
    return deckCards.filter((c) => c.name === initialCard.name).length;
  }, [deckCards, initialCard.name, isDeckCard]);

  const hasArtChanged = useMemo(() => {
    // Art changed if the internal card state has a selectedPrintId that differs from any pre-existing one
    const currentPrintId = card.id; // handleSelectPrint sets card to the print's full data
    const originalPrintId = initialCard.selectedPrintId || initialCard.id;
    return currentPrintId !== originalPrintId;
  }, [card.id, initialCard.id, initialCard.selectedPrintId]);

  // Token lightbox
  const [selectedToken, setSelectedToken] = useState<Card | null>(null);

  const getCardFaceImageUrl = (printCard: Card): string => {
    if (printCard.selectedPrintImageUri) return printCard.selectedPrintImageUri;
    const imageUris = printCard.image_uris ?? printCard.card_faces?.[0]?.image_uris;
    if (!imageUris) return '';
    return imageUris.normal || imageUris.large || '';
  };

  const { tokens: relatedTokens } = useCardRelatedTokensForCard(isToken ? null : card);

  const hasMultipleFaces = !!card.card_faces && card.card_faces.length > 1;
  const [showBackFace, setShowBackFace] = useState(false);

  const currentFace = hasMultipleFaces ? card.card_faces?.[showBackFace ? 1 : 0] : null;

  const recursiveCard = useMemo(() => {
    if (!selectedToken) return null;
    const matchingDeckToken = deckRelatedTokens?.find((t) => t.tokenCard.name === selectedToken.name);
    if (matchingDeckToken) {
      return {
        ...selectedToken,
        id: matchingDeckToken.tokenCard.id
      };
    }
    return selectedToken;
  }, [selectedToken, deckRelatedTokens]);

  const isRecursiveDeckCard = useMemo(() => {
    if (!selectedToken) return false;
    return !!deckRelatedTokens?.some((t) => t.tokenCard.name === selectedToken.name);
  }, [selectedToken, deckRelatedTokens]);

  const displayImageUrl = useMemo(() => {
    if (hoveredImageUrl) return hoveredImageUrl;
    if (hasMultipleFaces) {
      const face = card.card_faces?.[showBackFace ? 1 : 0];
      return face?.image_uris?.normal || face?.image_uris?.large || currentImageUrl;
    }
    return currentImageUrl;
  }, [card, showBackFace, hasMultipleFaces, currentImageUrl, hoveredImageUrl]);

  const [visibleImageUrl, setVisibleImageUrl] = useState<string>(displayImageUrl);
  const [isPreloading, setIsPreloading] = useState(false);

  useEffect(() => {
    if (visibleImageUrl === displayImageUrl) {
      setIsPreloading(false);
      return;
    }

    setIsPreloading(true);
    let isMounted = true;
    const img = new Image();
    img.src = displayImageUrl;
    img.onload = () => {
      if (isMounted) {
        setVisibleImageUrl(displayImageUrl);
        setIsPreloading(false);
      }
    };
    img.onerror = () => {
      if (isMounted) {
        setVisibleImageUrl(displayImageUrl);
        setIsPreloading(false);
      }
    };
    return () => {
      isMounted = false;
    };
  }, [displayImageUrl, visibleImageUrl]);

  const handleSelectPrint = (printCard: Card) => {
    const imgUrl = getCardFaceImageUrl(printCard);
    const updatedCard: Card = {
      ...printCard,
      selectedPrintId: printCard.id,
      selectedPrintImageUri: imgUrl
    };
    setCard(updatedCard);
    setCurrentImageUrl(imgUrl);
  };

  const handleConfirmArtChange = () => {
    // Keep the original card id so parent can find and update the right card in the deck
    // but apply the new print's image_uris and metadata
    const confirmedCard: Card = {
      ...initialCard, // keep original id (used to find in deck)
      image_uris: card.image_uris, // new print art
      card_faces: card.card_faces, // new print faces if any
      set: card.set,
      set_name: card.set_name,
      collector_number: card.collector_number,
      selectedPrintId: card.id, // the new print id
      selectedPrintImageUri: currentImageUrl // the resolved image URL
    };
    onSelectPrint?.(confirmedCard);
  };

  const handleIncrementCopies = () => {
    onAddToDeck?.(initialCard);
  };

  const handleDecrementCopies = () => {
    onRemoveFromDeck?.(initialCard);
  };

  return createPortal(
    <>
      {/* Main modal */}
      <div
        className="modal-overlay z-[200]"
        style={{ zIndex }}
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose();
        }}
        role="button"
        tabIndex={-1}
        aria-label={t('common.close')}
      >
        <div
          className="modal-container modal-container-large relative max-h-[95vh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-card-title"
        >
          {/* × Close button — top right corner */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 z-10 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/60"
            aria-label={t('common.close')}
          >
            <FaTimes className="text-base" />
          </button>
          <div className="flex flex-col md:flex-row gap-6 flex-1 overflow-y-auto custom-scrollbar pr-2 pb-2">
            {/* ── Left: edition sidebar + card image ── */}
            <div className="flex flex-col md:flex-row gap-4 items-center md:items-start shrink-0 animate-fadeIn">
              {showPrintsSidebar && !hidePrintsSidebar && (
                <CardDetailPrintsSidebar
                  isLoading={isPrintsLoading}
                  prints={prints}
                  currentCard={card}
                  onHoverImageUrl={setHoveredImageUrl}
                  onSelectPrint={handleSelectPrint}
                  getCardFaceImageUrl={getCardFaceImageUrl}
                />
              )}

              {/* Card image */}
              <div className="card-detail-image-wrapper flex flex-col items-center gap-3 shrink-0 relative group/image">
                <img
                  src={visibleImageUrl}
                  alt={currentFace ? currentFace.name : card.name}
                  className={`card-detail-image transition-all duration-200 ${isPreloading ? 'opacity-70 scale-[0.98] brightness-90' : 'opacity-100 scale-100'
                    }`}
                />
                {hasMultipleFaces && (
                  <button
                    type="button"
                    onClick={() => setShowBackFace((prev) => !prev)}
                    className="absolute top-4 left-4 z-20 p-3 rounded-full 
                      bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20
                      text-white shadow-xl
                      transition-all duration-300 transform hover:scale-110 active:scale-95
                      flex items-center justify-center opacity-80 hover:opacity-100"
                    title={t('cardDetails.flipAction')}
                  >
                    <FaSync className={`text-xl transition-transform duration-500 ${showBackFace ? '-rotate-180' : 'rotate-0'}`} />
                  </button>
                )}
              </div>
            </div>

            {/* ── Right: card info ── */}
            <div className="card-detail-info">
              <CardDetailData
                card={card}
                currentFace={currentFace}
                hidePriceAndLegality={hidePriceAndLegality}
                isToken={isToken}
              />

              {/* Related tokens section */}
              <CardDetailRelatedTokens relatedTokens={relatedTokens} onCardClick={setSelectedToken} />

              {/* Edit and Copy controls for Deck Cards */}
              <div className="w-full mt-auto">
                <CardDetailEditControls
                  isDeckCard={isDeckCard}
                  isEditMode={isEditMode}
                  isToken={isToken}
                  hidePrintsSidebar={hidePrintsSidebar}
                  copiesCount={copiesCount}
                  hasArtChanged={hasArtChanged}
                  prints={prints}
                  showPrintsSidebar={showPrintsSidebar}
                  setShowPrintsSidebar={setShowPrintsSidebar}
                  handleDecrementCopies={handleDecrementCopies}
                  handleIncrementCopies={handleIncrementCopies}
                  handleConfirmArtChange={handleConfirmArtChange}
                />

                {/* Action buttons (e.g., Add to Deck) */}
                <CardDetailActions
                  card={card}
                  isDeckCard={isDeckCard}
                  isToken={isToken}
                  onAddCardToDeck={
                    (isToken && onAddTokenToDeck) || onAddToDeck
                      ? () => {
                        if (isToken && onAddTokenToDeck) {
                          onAddTokenToDeck(card);
                        } else if (onAddToDeck) {
                          onAddToDeck(card);
                        }
                        onClose();
                      }
                      : undefined
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Token details modal */}
      {selectedToken && (
        <CardDetailModal
          card={recursiveCard || selectedToken}
          imageUrl={getCardImageUrl(selectedToken)}
          onAddToDeck={isToken ? onAddTokenToDeck || onAddToDeck : onAddToDeck}
          onAddTokenToDeck={onAddTokenToDeck}
          onClose={() => setSelectedToken(null)}
          isToken={true}
          isDeckCard={isRecursiveDeckCard}
          hidePrintsSidebar={true}
          hidePriceAndLegality={hidePriceAndLegality}
          deckRelatedTokens={deckRelatedTokens}
          onRemoveFromDeck={onRemoveFromDeck}
          isEditMode={isEditMode}
          deckCards={isToken ? deckRelatedTokens?.map((t) => t.tokenCard) || [] : deckCards}
          zIndex={zIndex + 10}
        />
      )}
    </>,
    document.body
  ) as unknown as ReactNode;
}

export default CardDetailModal;
