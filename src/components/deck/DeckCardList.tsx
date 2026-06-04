import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { FaCrown, FaPlus, FaMinus, FaTrash, FaBan, FaExclamationTriangle, FaPalette } from 'react-icons/fa';
import { Card } from '../../types/Card';
import { CardSize } from '../../types';
import { DeckFormat } from '../../types/Deck';
import { GroupedCards, groupCardsByUnique, getCardImageUrl } from '../../utils/deckGrouping';
import { parseTextWithSymbols } from '../../utils/symbolHelper';
import CardGrid from '../CardGrid';
import CardDetailModal from '../CardDetailModal';
import DeckCommandersHeader from './DeckCommandersHeader';

interface DeckCardListProps {
  groups: GroupedCards[];
  commanders: Card[];
  cardSize: CardSize;
  viewMode: 'list' | 'grid';
  isRemovable: boolean;
  activeFormat?: DeckFormat;
  onUpdateCardZone?: (cardId: string, zone: 'main' | 'sideboard' | 'maybeboard') => void;
  onAddToDeck: (card: Card) => void;
  onRemoveFromDeck: (card: Card) => void;
  onToggleCommander: (card: Card) => void;
  onHoverEnter: (card: Card, e: React.MouseEvent) => void;
  onHoverMove: (e: React.MouseEvent) => void;
  onHoverLeave: () => void;
  onUpdateCard?: (updatedCard: Card) => void;
  isTokenZone?: boolean;
}

const TRANSLATABLE_TITLES = [
  'creature',
  'planeswalker',
  'instant',
  'sorcery',
  'enchantment',
  'artifact',
  'land',
  'white',
  'blue',
  'black',
  'red',
  'green',
  'colorless',
  'multicolored'
];

function DeckCardList({
  groups,
  commanders,
  cardSize,
  viewMode,
  isRemovable,
  isTokenZone = false,
  activeFormat,
  onUpdateCardZone,
  onAddToDeck,
  onRemoveFromDeck,
  onToggleCommander,
  onHoverEnter,
  onHoverMove,
  onHoverLeave,
  onUpdateCard
}: DeckCardListProps) {
  const { t } = useTranslation();
  const [selectedModalCard, setSelectedModalCard] = useState<Card | null>(null);

  // Sync selectedModalCard when groups change (e.g. after art update)
  useEffect(() => {
    if (!selectedModalCard) return;
    const allCards = groups.flatMap((g) => g.cards);
    const updated = allCards.find((c) => c.id === selectedModalCard.id);
    if (updated && updated !== selectedModalCard) {
      setSelectedModalCard(updated);
    }
  }, [groups, selectedModalCard]);

  // Wrap onUpdateCard to also update the modal card state immediately
  const handleUpdateCard = useCallback(
    (updatedCard: Card) => {
      setSelectedModalCard(updatedCard);
      onUpdateCard?.(updatedCard);
    },
    [onUpdateCard]
  );

  const commandersHeader = (
    <DeckCommandersHeader
      commanders={commanders}
      cardSize={cardSize}
      viewMode={viewMode}
      isRemovable={isRemovable}
      onHoverEnter={onHoverEnter}
      onHoverMove={onHoverMove}
      onHoverLeave={onHoverLeave}
      onToggleCommander={onToggleCommander}
      onAddToDeck={onAddToDeck}
      onRemoveFromDeck={onRemoveFromDeck}
      onCardSelect={setSelectedModalCard}
      onUpdateCard={handleUpdateCard}
    />
  );

  if (viewMode === 'grid') {
    if (groups.length === 1 && groups[0].title === '') {
      return (
        <div className="space-y-6">
          {commandersHeader}
          <CardGrid
            cards={groups[0].cards}
            size={cardSize}
            onAddToDeck={isRemovable && !isTokenZone ? onAddToDeck : undefined}
            onRemoveFromDeck={isRemovable ? onRemoveFromDeck : undefined}
            showRemoveButton={isRemovable}
            isDeckCard={true}
            deckCards={groups[0].cards}
            onSelectPrint={handleUpdateCard}
            isToken={isTokenZone}
            isEditMode={isRemovable}
          />
        </div>
      );
    }
    return (
      <div className="space-y-6">
        {commandersHeader}
        <div className="space-y-6">
          {groups.map((group) => {
            const title = TRANSLATABLE_TITLES.includes(group.title) ? t(group.title) : group.title;
            return (
              <div key={group.title} className="space-y-2">
                <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 pb-1 flex justify-between items-center">
                  <span>{title}</span>
                  <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full text-gray-600 dark:text-gray-300">
                    {group.cards.length}
                  </span>
                </h4>
                <CardGrid
                  cards={group.cards}
                  size={cardSize}
                  onAddToDeck={isRemovable && !isTokenZone ? onAddToDeck : undefined}
                  onRemoveFromDeck={isRemovable ? onRemoveFromDeck : undefined}
                  showRemoveButton={isRemovable}
                  isDeckCard={true}
                  deckCards={groups.flatMap((g) => g.cards)}
                  onSelectPrint={handleUpdateCard}
                  isToken={isTokenZone}
                  isEditMode={isRemovable}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-6">
      {commandersHeader}
      <div className="space-y-6">
        {groups.map((group) => {
          const title = TRANSLATABLE_TITLES.includes(group.title) ? t(group.title) : group.title;
          const uniqueCards = groupCardsByUnique(group.cards);

          return (
            <div key={group.title} className="space-y-2">
              {title && (
                <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 pb-1 flex justify-between items-center select-none">
                  <span>{title}</span>
                  <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full text-gray-600 dark:text-gray-300">
                    {group.cards.length}
                  </span>
                </h4>
              )}
              <div className="deck-list-compact">
                {uniqueCards.map(({ count, card }) => {
                  const isBanned =
                    activeFormat &&
                    activeFormat !== 'freeform' &&
                    card.legalities?.[activeFormat as keyof typeof card.legalities] === 'banned';
                  const isRestricted =
                    activeFormat &&
                    activeFormat !== 'freeform' &&
                    card.legalities?.[activeFormat as keyof typeof card.legalities] === 'restricted';

                  return (
                    <div key={card.id} className="animate-fadeIn">
                      <div
                        className={`deck-list-row group transition-all duration-200 ${
                          isBanned
                            ? 'border-red-300 dark:border-red-900/60 bg-red-500/5 dark:bg-red-950/10 hover:bg-red-500/10'
                            : isRestricted
                              ? 'border-amber-300 dark:border-amber-900/60 bg-amber-500/5 dark:bg-amber-950/10 hover:bg-amber-500/10'
                              : ''
                        }`}
                        onClick={() => setSelectedModalCard(card)}
                        onMouseEnter={(e) => onHoverEnter(card, e)}
                        onMouseMove={onHoverMove}
                        onMouseLeave={onHoverLeave}
                      >
                        <div className="flex items-center min-w-0 pr-2">
                          <span
                            className={`quantity-badge ${isBanned ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100' : ''}`}
                          >
                            {count}x
                          </span>
                          <span
                            className={`font-semibold truncate text-sm hover:text-blue-600 dark:hover:text-blue-400 transition-colors ${isBanned ? 'text-red-600 dark:text-red-400 font-extrabold' : 'text-gray-800 dark:text-gray-200'}`}
                          >
                            {card.printed_name || card.name}
                          </span>
                          {card.isCommander && (
                            <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50 shrink-0 shadow-sm animate-pulse">
                              <FaCrown className="text-amber-500 dark:text-amber-400 shrink-0 text-[10px]" />
                              {t('commanderBadge')}
                            </span>
                          )}
                          {isBanned && (
                            <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-900/50 shrink-0 shadow-sm animate-pulse">
                              <FaBan className="text-red-500 dark:text-red-400 text-[9px] shrink-0" />
                              {t('banned').toUpperCase()}
                            </span>
                          )}
                          {isRestricted && (
                            <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50 shrink-0 shadow-sm">
                              <FaExclamationTriangle className="text-amber-500 dark:text-amber-400 text-[9px] shrink-0" />
                              {t('restricted').toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div
                          className="flex items-center gap-3 shrink-0"
                          onMouseEnter={onHoverLeave}
                          onMouseLeave={(e) => onHoverEnter(card, e)}
                        >
                          {card.mana_cost && (
                            <span className="flex items-center gap-0.5 mr-2">
                              {parseTextWithSymbols(card.mana_cost)}
                            </span>
                          )}

                          {/* Quick Edit Buttons on Hover */}
                          {isRemovable && (
                            <div
                              className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {activeFormat === 'commander' && !isTokenZone && (
                                <button
                                  type="button"
                                  onClick={() => onToggleCommander(card)}
                                  className="w-6 h-6 rounded-full flex items-center justify-center bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-900/60 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900 transition-all shadow-sm"
                                  title={card.isCommander ? t('removeAsCommander') : t('setAsCommander')}
                                >
                                  <FaCrown className="text-[10px]" />
                                </button>
                              )}

                              {onUpdateCardZone && !isTokenZone && (
                                <select
                                  value={card.zone || 'main'}
                                  onChange={(e) =>
                                    onUpdateCardZone(card.id, e.target.value as 'main' | 'sideboard' | 'maybeboard')
                                  }
                                  className="text-[10px] font-semibold bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded px-1.5 py-0.5 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm"
                                >
                                  <option value="main">{t('mainDeckCompact')}</option>
                                  <option value="sideboard">{t('sideboardCompact')}</option>
                                  <option value="maybeboard">{t('maybeboardCompact')}</option>
                                </select>
                              )}

                              {onUpdateCard && !isTokenZone && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedModalCard(card)}
                                  className="w-6 h-6 rounded-full flex items-center justify-center bg-pink-50 dark:bg-pink-950/60 border border-pink-300 dark:border-pink-900/60 text-pink-600 dark:text-pink-400 hover:bg-pink-500 hover:text-white transition-all font-bold shadow-sm"
                                  title={t('changeArt')}
                                >
                                  <FaPalette className="text-[9px]" />
                                </button>
                              )}

                              {/* Token zone: change art button */}
                              {isTokenZone && onUpdateCard && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedModalCard(card)}
                                  className="w-6 h-6 rounded-full flex items-center justify-center bg-pink-50 dark:bg-pink-950/60 border border-pink-300 dark:border-pink-900/60 text-pink-600 dark:text-pink-400 hover:bg-pink-500 hover:text-white transition-all font-bold shadow-sm"
                                  title={t('changeArt')}
                                >
                                  <FaPalette className="text-[9px]" />
                                </button>
                              )}

                              {/* Token zone: add copy button */}
                              {isTokenZone && (
                                <button
                                  type="button"
                                  onClick={() => onAddToDeck(card)}
                                  className="w-6 h-6 rounded-full flex items-center justify-center bg-green-50 dark:bg-green-950/60 border border-green-300 dark:border-green-900/60 text-green-600 dark:text-green-400 hover:bg-green-500 hover:text-white transition-all font-bold shadow-sm"
                                  title={t('addCopy')}
                                >
                                  <FaPlus className="text-[8px]" />
                                </button>
                              )}

                              {!isTokenZone && (
                                <button
                                  type="button"
                                  onClick={() => onAddToDeck(card)}
                                  className="w-6 h-6 rounded-full flex items-center justify-center bg-green-50 dark:bg-green-950/60 border border-green-300 dark:border-green-900/60 text-green-600 dark:text-green-400 hover:bg-green-500 hover:text-white transition-all font-bold shadow-sm"
                                  title={t('addCopy')}
                                >
                                  <FaPlus className="text-[8px]" />
                                </button>
                              )}

                              {!isTokenZone && (
                                <button
                                  type="button"
                                  onClick={() => onRemoveFromDeck(card)}
                                  className="w-6 h-6 rounded-full flex items-center justify-center bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-900/60 text-amber-600 dark:text-amber-400 hover:bg-amber-500 hover:text-white transition-all font-bold shadow-sm"
                                  title={t('removeCopy')}
                                >
                                  <FaMinus className="text-[8px]" />
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  if (isTokenZone) {
                                    onRemoveFromDeck(card);
                                  } else {
                                    for (let copyIndex = 0; copyIndex < count; copyIndex++) {
                                      onRemoveFromDeck(card);
                                    }
                                  }
                                }}
                                className="w-6 h-6 rounded-full flex items-center justify-center bg-red-50 dark:bg-red-950/60 border border-red-300 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white transition-all font-bold shadow-sm"
                                title={isTokenZone ? t('deleteToken') : t('deleteCard')}
                              >
                                <FaTrash className="text-[8px]" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {selectedModalCard && (
        <CardDetailModal
          card={selectedModalCard}
          imageUrl={getCardImageUrl(selectedModalCard)}
          onAddToDeck={isRemovable ? onAddToDeck : undefined}
          onClose={() => setSelectedModalCard(null)}
          onSelectPrint={handleUpdateCard}
          isToken={isTokenZone}
          isDeckCard={true}
          deckCards={groups.flatMap((g) => g.cards)}
          onRemoveFromDeck={onRemoveFromDeck}
          isEditMode={isRemovable}
        />
      )}
    </div>
  );
}

export default DeckCardList;
