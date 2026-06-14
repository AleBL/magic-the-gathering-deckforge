import { ReactNode, useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { FaCrown, FaShieldAlt, FaSync, FaPalette, FaPlus, FaMinus } from 'react-icons/fa';
import { Card } from '../types/Card';
import { parseTextWithSymbols } from '../utils/symbolHelper';
import { useCardPrints } from '../hooks/useCardPrints';
import { useCardRelatedTokensForCard } from '../hooks/useCardRelatedTokens';
import { getCardImageUrl } from '../utils/deckGrouping';
import { DeckRelatedToken } from '../types/Deck';

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
}

/** Rarity pill colours for the set sidebar */
const RARITY_STYLES: Record<string, string> = {
  mythic:
    'border-orange-500/60 bg-gradient-to-b from-orange-500/20 to-orange-600/5 text-orange-500 dark:text-orange-400 shadow-[0_0_8px_rgba(249,115,22,0.15)]',
  rare: 'border-amber-400/60 bg-gradient-to-b from-amber-400/15 to-amber-500/5 text-amber-600 dark:text-amber-400',
  uncommon: 'border-slate-400/50 bg-gradient-to-b from-slate-400/10 to-slate-500/5 text-slate-600 dark:text-slate-300',
  common: 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/40 text-gray-600 dark:text-gray-400'
};

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
  defaultShowPrints
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
        style={{ zIndex: 200 }}
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose();
        }}
        role="button"
        tabIndex={-1}
        aria-label={t('close')}
      >
        <div
          className="modal-container modal-container-large"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-card-title"
        >
          <div className="flex flex-col md:flex-row gap-6">
            {/* ── Left: edition sidebar + card image ── */}
            <div className="flex flex-col md:flex-row gap-4 items-center md:items-start shrink-0 animate-fadeIn">
              {/* Edition sidebar – vertical on desktop, horizontal scroll on mobile */}
              {showPrintsSidebar &&
                !hidePrintsSidebar &&
                (isPrintsLoading ? (
                  <div
                    className="flex flex-row md:flex-col gap-1.5 max-w-full max-h-20 md:max-h-[400px] py-1 shrink-0 animate-pulse select-none"
                    aria-label="Loading editions"
                  >
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-100/50 dark:bg-gray-800/40 w-[52px] h-[52px] flex items-center justify-center shrink-0"
                      >
                        <span className="w-6 h-2 bg-gray-300 dark:bg-gray-650 rounded-md" />
                      </div>
                    ))}
                  </div>
                ) : (
                  prints.length > 1 && (
                    <div
                      className="flex flex-row md:flex-col gap-1.5 overflow-x-auto md:overflow-y-auto max-w-full max-h-20 md:max-h-[400px] pr-1 pb-1 md:pb-0 scrollbar-thin select-none py-1 shrink-0 animate-fadeIn"
                      aria-label="Card editions"
                    >
                      {prints.map((printCard) => {
                        const isSelected = (card.selectedPrintId || card.id) === printCard.id;
                        const rarity = printCard.rarity?.toLowerCase() as keyof typeof RARITY_STYLES;
                        const rarityStyle = RARITY_STYLES[rarity] || RARITY_STYLES.common;

                        return (
                          <button
                            type="button"
                            key={printCard.id}
                            onMouseEnter={() => setHoveredImageUrl(getCardFaceImageUrl(printCard))}
                            onMouseLeave={() => setHoveredImageUrl(null)}
                            onClick={() => handleSelectPrint(printCard)}
                            title={`${printCard.set_name} · ${printCard.set?.toUpperCase()} #${printCard.collector_number || ''}`}
                            aria-pressed={isSelected}
                            className={`group relative shrink-0 rounded-xl flex flex-col items-center justify-center border transition-all duration-200 px-1.5 py-2 min-w-[52px] md:w-14 cursor-pointer ${
                              isSelected
                                ? 'border-blue-500 bg-blue-500/15 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500/30 shadow-md brightness-110'
                                : `${rarityStyle} hover:border-blue-400/60 hover:bg-blue-500/5 hover:brightness-110 hover:shadow-xs`
                            }`}
                          >
                            {/* Set code */}
                            <span className="text-[10px] uppercase font-black tracking-tight leading-none">
                              {printCard.set}
                            </span>
                            {/* Collector number */}
                            <span className="text-[7px] font-semibold select-none mt-0.5 leading-none opacity-70">
                              #{printCard.collector_number || ''}
                            </span>
                            {/* Rarity dot */}
                            <span
                              className={`mt-1 w-1 h-1 rounded-full inline-block transition-opacity ${
                                rarity === 'mythic'
                                  ? 'bg-orange-500'
                                  : rarity === 'rare'
                                    ? 'bg-amber-500'
                                    : rarity === 'uncommon'
                                      ? 'bg-slate-400'
                                      : 'bg-gray-400'
                              } ${isSelected ? 'opacity-100' : 'opacity-50 group-hover:opacity-80'}`}
                            />
                            {/* Selection indicator */}
                            {isSelected && (
                              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-500 rounded-full border-2 border-white dark:border-gray-800 shadow-sm" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )
                ))}

              {/* Card image */}
              <div className="card-detail-image-wrapper flex flex-col items-center gap-3 shrink-0">
                <img
                  src={visibleImageUrl}
                  alt={currentFace ? currentFace.name : card.name}
                  className={`card-detail-image transition-all duration-200 ${
                    isPreloading ? 'opacity-70 scale-[0.98] brightness-90' : 'opacity-100 scale-100'
                  }`}
                />
                {hasMultipleFaces && (
                  <button
                    type="button"
                    onClick={() => setShowBackFace((prev) => !prev)}
                    className="secondary-button text-xs py-1.5 px-4 flex items-center gap-1.5 shadow-md w-full justify-center"
                  >
                    <FaSync className={`transition-transform duration-500 ${showBackFace ? 'rotate-180' : ''}`} />
                    {t('flipAction')}
                  </button>
                )}
              </div>
            </div>

            {/* ── Right: card info ── */}
            <div className="card-detail-info">
              <div className="flex flex-wrap items-center gap-2">
                <h2 id="modal-card-title" className="text-2xl font-bold">
                  {currentFace ? currentFace.printed_name || currentFace.name : card.printed_name || card.name}
                </h2>
                {card.isCommander && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-900/50 shadow-sm animate-pulse">
                    <FaCrown className="text-amber-500 dark:text-amber-400 text-xs shrink-0" />
                    {t('commanderBadge') || 'Comandante'}
                  </span>
                )}
              </div>
              <p className="text-gray-700 dark:text-gray-300 transition-colors duration-300">
                {currentFace
                  ? currentFace.printed_type_line || currentFace.type_line
                  : card.printed_type_line || card.type_line}
              </p>
              {((currentFace && currentFace.mana_cost) || card.mana_cost) && (
                <p className="text-yellow-600 dark:text-yellow-400 transition-colors duration-300 flex items-center flex-wrap gap-1">
                  {t('manaCostLabel')}:{' '}
                  {parseTextWithSymbols(currentFace ? currentFace.mana_cost : card.mana_cost, true)}
                </p>
              )}
              {((currentFace && (currentFace.printed_text || currentFace.oracle_text)) ||
                card.printed_text ||
                card.oracle_text) && (
                <div>
                  <h3 className="font-semibold mb-1">{t('textLabel')}:</h3>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line transition-colors duration-300 leading-relaxed">
                    {parseTextWithSymbols(
                      currentFace
                        ? currentFace.printed_text || currentFace.oracle_text
                        : card.printed_text || card.oracle_text
                    )}
                  </p>
                </div>
              )}
              {((currentFace && currentFace.power && currentFace.toughness) || (card.power && card.toughness)) && (
                <p className="text-green-600 dark:text-green-400 transition-colors duration-300">
                  {t('powerToughnessLabel')}: {currentFace ? currentFace.power : card.power}/
                  {currentFace ? currentFace.toughness : card.toughness}
                </p>
              )}
              <p className="text-gray-600 dark:text-gray-400 transition-colors duration-300">
                {t('rarityLabel')}: {t(card.rarity.toLowerCase()) || card.rarity}
              </p>
              <p className="text-gray-600 dark:text-gray-400 transition-colors duration-300">
                {t('setLabel')}: {card.set_name}
              </p>

              {!isToken && !hidePriceAndLegality && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                  <h3 className="font-semibold mb-2 text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('prices')}:
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-gray-100/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-center">
                      <span className="block text-xs text-gray-500">{t('usd')}</span>
                      <span className="font-semibold text-sm text-gray-800 dark:text-gray-200">
                        {card.prices?.usd ? `$${card.prices.usd}` : t('priceNotAvailable')}
                      </span>
                    </div>
                    <div className="bg-gray-100/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-center">
                      <span className="block text-xs text-gray-500">{t('eur')}</span>
                      <span className="font-semibold text-sm text-gray-800 dark:text-gray-200">
                        {card.prices?.eur ? `€${card.prices.eur}` : t('priceNotAvailable')}
                      </span>
                    </div>
                    <div className="bg-gray-100/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-center">
                      <span className="block text-xs text-gray-500">{t('tix')}</span>
                      <span className="font-semibold text-sm text-gray-800 dark:text-gray-200">
                        {card.prices?.tix ? `${card.prices.tix}` : t('priceNotAvailable')}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {card.legalities && !isToken && !hidePriceAndLegality && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-1">
                  <h3 className="font-bold mb-3 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                    <FaShieldAlt className="text-blue-500 text-xs shrink-0" />
                    <span>{t('legality')}</span>
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {(['standard', 'modern', 'commander', 'vintage', 'pauper'] as const).map((fmt) => {
                      const status = card.legalities?.[fmt];
                      if (!status) return null;

                      let bgClass = '';
                      let dotClass = '';
                      let label = t('notLegal');

                      if (status === 'legal') {
                        bgClass =
                          'bg-emerald-500/5 text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40';
                        dotClass = 'bg-emerald-500 dark:bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]';
                        label = t('legal');
                      } else if (status === 'banned') {
                        bgClass = 'bg-red-500/5 text-red-800 dark:text-red-400 border-red-200 dark:border-red-900/40';
                        dotClass = 'bg-red-500 dark:bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse';
                        label = t('banned');
                      } else if (status === 'restricted') {
                        bgClass =
                          'bg-amber-500/5 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-900/40';
                        dotClass = 'bg-amber-500 dark:bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]';
                        label = t('restricted');
                      } else {
                        bgClass =
                          'bg-gray-500/5 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700/50';
                        dotClass = 'bg-gray-400 dark:bg-gray-500';
                        label = t('notLegal');
                      }

                      return (
                        <div
                          key={fmt}
                          className={`flex flex-col justify-center px-2.5 py-1.5 rounded-xl border transition-all duration-200 hover:brightness-105 hover:shadow-xs ${bgClass}`}
                        >
                          <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider leading-none">
                            {t(fmt)}
                          </span>
                          <div className="flex items-center gap-1.5 mt-1 shrink-0">
                            <span className={`w-1.5 h-1.5 rounded-full inline-block ${dotClass}`} />
                            <span className="text-[10px] font-extrabold uppercase tracking-wide select-none leading-none">
                              {label}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Edit and Copy controls for Deck Cards */}
              {isDeckCard && isEditMode && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-3 space-y-3">
                  <h3 className="font-bold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-1.5 select-none">
                    <FaPalette className="text-indigo-500 text-xs shrink-0" />
                    <span>{t('editCardTitle')}</span>
                  </h3>

                  <div className="bg-gray-100/50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700 rounded-xl p-3.5 flex flex-row items-center justify-between gap-3 shadow-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
                        {t('copiesInDeck', { count: copiesCount })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={handleDecrementCopies}
                        disabled={copiesCount <= 0}
                        className="w-7 h-7 rounded-full flex items-center justify-center bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-900/60 text-amber-600 dark:text-amber-400 hover:bg-amber-500 hover:text-white disabled:opacity-40 transition-all font-bold cursor-pointer shadow-sm"
                        title={t('removeCopy')}
                      >
                        <FaMinus className="text-[9px]" />
                      </button>
                      <button
                        type="button"
                        onClick={handleIncrementCopies}
                        className="w-7 h-7 rounded-full flex items-center justify-center bg-green-50 dark:bg-green-950/60 border border-green-300 dark:border-green-900/60 text-green-600 dark:text-green-400 hover:bg-green-500 hover:text-white transition-all font-bold cursor-pointer shadow-sm"
                        title={t('addCopy')}
                      >
                        <FaPlus className="text-[9px]" />
                      </button>
                    </div>
                  </div>

                  {!isToken && !hidePrintsSidebar && (
                    <div className="flex flex-wrap gap-2.5">
                      {prints.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setShowPrintsSidebar((prev) => !prev)}
                          className={`secondary-button text-xs py-2 px-3.5 flex-1 flex items-center justify-center gap-1.5 shadow-sm border border-gray-200 dark:border-gray-700 transition-all ${
                            showPrintsSidebar
                              ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30'
                              : ''
                          }`}
                        >
                          <FaPalette className="text-xs shrink-0" />
                          {t('changeArt')}
                        </button>
                      )}

                      {hasArtChanged && (
                        <button
                          type="button"
                          onClick={handleConfirmArtChange}
                          className="success-button text-xs py-2 px-3.5 flex-1 flex items-center justify-center gap-1.5 shadow-md transition-all"
                        >
                          <FaSync className="text-xs shrink-0 animate-spin-slow" />
                          {t('updateArt')}
                        </button>
                      )}
                    </div>
                  )}

                  {isToken && prints.length > 1 && !hidePrintsSidebar && (
                    <div className="flex flex-wrap gap-2.5">
                      <button
                        type="button"
                        onClick={() => setShowPrintsSidebar((prev) => !prev)}
                        className={`secondary-button text-xs py-2 px-3.5 flex-1 flex items-center justify-center gap-1.5 shadow-sm border border-gray-200 dark:border-gray-700 transition-all ${
                          showPrintsSidebar
                            ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30'
                            : ''
                        }`}
                      >
                        <FaPalette className="text-xs shrink-0" />
                        {t('changeArt')}
                      </button>

                      {hasArtChanged && (
                        <button
                          type="button"
                          onClick={handleConfirmArtChange}
                          className="success-button text-xs py-2 px-3.5 flex-1 flex items-center justify-center gap-1.5 shadow-md transition-all"
                        >
                          <FaSync className="text-xs shrink-0 animate-spin-slow" />
                          {t('updateArt')}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Related tokens section */}
              {relatedTokens.length > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-3 text-left">
                  <h3 className="font-bold mb-2 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-1.5 select-none">
                    <FaPalette className="text-pink-500 text-xs shrink-0" />
                    <span>{t('cardTokensSection')}</span>
                  </h3>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 pt-1">
                    {relatedTokens.map((token) => {
                      const tokenImg = getCardImageUrl(token);
                      return (
                        <div key={token.id} className="card-item-wrapper group relative">
                          <button
                            type="button"
                            onClick={() => setSelectedToken(token)}
                            className="card-image-button animate-fadeIn cursor-pointer"
                            aria-label={token.name}
                            title={t('clickToView')}
                          >
                            {tokenImg ? (
                              <img
                                src={tokenImg}
                                alt={token.name}
                                className="card-image-content transition-all duration-300"
                                loading="lazy"
                                onError={(e) => {
                                  const target = e.currentTarget;
                                  const fallbackUrl =
                                    token.image_uris?.normal || token.card_faces?.[0]?.image_uris?.normal;
                                  if (fallbackUrl && target.src !== fallbackUrl) {
                                    target.src = fallbackUrl;
                                  }
                                }}
                              />
                            ) : (
                              <div className="flex flex-col items-center justify-center gap-1.5 p-2 text-center w-full h-full bg-slate-900 border border-slate-800 rounded-lg">
                                <FaPalette className="text-pink-500/40 text-sm shrink-0" />
                                <span className="text-[9px] text-gray-400 font-bold leading-tight break-words line-clamp-3 select-none">
                                  {token.name}
                                </span>
                              </div>
                            )}
                          </button>

                          <div className="card-action-overlay pointer-events-none">
                            <p className="card-action-title flex items-center justify-center gap-1 text-[10px] font-bold text-center">
                              {token.printed_name || token.name}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="modal-actions">
                {!isDeckCard && (isToken ? onAddTokenToDeck : onAddToDeck) && (
                  <button
                    onClick={() => {
                      if (isToken && onAddTokenToDeck) {
                        onAddTokenToDeck(card);
                      } else if (onAddToDeck) {
                        onAddToDeck(card);
                      }
                      onClose();
                    }}
                    className="success-button"
                  >
                    {isToken ? t('addToken') : t('addToDeck')}
                  </button>
                )}
                <button onClick={onClose} className="secondary-button">
                  {t('close')}
                </button>
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
        />
      )}
    </>,
    document.body
  ) as unknown as ReactNode;
}

export default CardDetailModal;
