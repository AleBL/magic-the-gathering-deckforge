import { ReactNode, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { FaCrown, FaShieldAlt, FaSync, FaPalette } from 'react-icons/fa';
import { Card } from '../types/Card';
import { parseTextWithSymbols } from '../utils/symbolHelper';
import { CardPrintsModal } from './CardPrintsModal';
import { useCardRelatedTokensForCard } from '../hooks/useCardRelatedTokens';

interface CardDetailModalProps {
  card: Card;
  imageUrl: string;
  onAddToDeck?: (card: Card) => void;
  onClose: () => void;
  onSelectPrint?: (updatedCard: Card) => void;
}

function CardDetailModal({ card: initialCard, imageUrl, onAddToDeck, onClose, onSelectPrint }: CardDetailModalProps) {
  const { t } = useTranslation();
  const [card, setCard] = useState<Card>(initialCard);
  const [currentImageUrl, setCurrentImageUrl] = useState<string>(imageUrl);
  const [isPrintsModalOpen, setIsPrintsModalOpen] = useState(false);

  const { tokens: relatedTokens } = useCardRelatedTokensForCard(card);

  const hasMultipleFaces = !!card.card_faces && card.card_faces.length > 1;
  const [showBackFace, setShowBackFace] = useState(false);

  const currentFace = hasMultipleFaces ? card.card_faces?.[showBackFace ? 1 : 0] : null;

  const displayImageUrl = useMemo(() => {
    if (hasMultipleFaces) {
      const face = card.card_faces?.[showBackFace ? 1 : 0];
      return face?.image_uris?.normal || face?.image_uris?.large || currentImageUrl;
    }
    return currentImageUrl;
  }, [card, showBackFace, hasMultipleFaces, currentImageUrl]);

  const handleSelectPrint = (updatedCard: Card) => {
    setCard(updatedCard);
    if (updatedCard.selectedPrintImageUri) {
      setCurrentImageUrl(updatedCard.selectedPrintImageUri);
    }
    onSelectPrint?.(updatedCard);
  };

  return createPortal(
    <div
      className="modal-overlay"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          onClose();
        }
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
          <div className="card-detail-image-wrapper flex flex-col items-center gap-3">
            <img
              src={displayImageUrl}
              alt={currentFace ? currentFace.name : card.name}
              className="card-detail-image animate-fadeIn"
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
                {t('manaCostLabel')}: {parseTextWithSymbols(currentFace ? currentFace.mana_cost : card.mana_cost, true)}
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

            {card.legalities && (
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
                        className={`flex items-center justify-between px-3 py-2 rounded-xl border transition-all duration-300 hover:scale-102 hover:shadow-xs ${bgClass}`}
                      >
                        <span className="text-xs font-bold capitalize">{t(fmt)}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={`w-1.5 h-1.5 rounded-full inline-block ${dotClass}`} />
                          <span className="text-[10px] font-extrabold uppercase tracking-wide select-none">
                            {label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {relatedTokens.length > 0 && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-3 text-left">
                <h3 className="font-bold mb-2 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-1.5 select-none">
                  <FaPalette className="text-pink-500 text-xs shrink-0" />
                  <span>{t('cardTokensSection', 'Tokens Created by this Card')}</span>
                </h3>
                <div className="flex flex-wrap gap-3 pt-1">
                  {relatedTokens.map((token) => {
                    const tokenImg = token.image_uris?.normal || token.card_faces?.[0]?.image_uris?.normal || '';
                    return (
                      <div
                        key={token.id}
                        className="group relative flex flex-col items-center border border-gray-200 dark:border-gray-700 rounded-xl p-2 bg-gray-50 dark:bg-gray-800/20 hover:scale-102 hover:border-pink-500/30 transition-all duration-300 shadow-sm"
                      >
                        <div className="w-16 h-22 sm:w-20 sm:h-28 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-750 bg-slate-950 flex items-center justify-center">
                          {tokenImg ? (
                            <img
                              src={tokenImg}
                              alt={token.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <span className="text-[8px] text-gray-500 font-bold p-1 text-center leading-tight">
                              {token.name}
                            </span>
                          )}
                        </div>
                        <span className="text-[9px] font-bold text-gray-700 dark:text-gray-300 mt-1.5 truncate max-w-[80px]">
                          {token.printed_name || token.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="modal-actions">
              {onAddToDeck && (
                <button
                  onClick={() => {
                    onAddToDeck(card);
                    onClose();
                  }}
                  className="success-button"
                >
                  {t('addToDeck')}
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsPrintsModalOpen(true)}
                className="secondary-button flex items-center gap-1.5"
              >
                <FaPalette className="text-pink-500 animate-pulse" />
                {t('otherVersions')}
              </button>
              <button onClick={onClose} className="secondary-button">
                {t('close')}
              </button>
            </div>
          </div>
        </div>
        {/* Alternate prints selection modal */}
        <CardPrintsModal
          cardName={card.name}
          isOpen={isPrintsModalOpen}
          onClose={() => setIsPrintsModalOpen(false)}
          onSelectPrint={handleSelectPrint}
        />
      </div>
    </div>,
    document.body
  ) as unknown as ReactNode;
}

export default CardDetailModal;
