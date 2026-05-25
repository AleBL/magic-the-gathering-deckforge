import { useTranslation } from 'react-i18next';
import { FaCrown, FaPlus, FaMinus, FaTrash } from 'react-icons/fa';
import { Card } from '../../types/Card';
import { CardSize } from '../../types';
import { groupCardsByUnique } from '../../utils/deckGrouping';
import { parseTextWithSymbols } from '../../utils/symbolHelper';
import CardGrid from '../CardGrid';

interface DeckCommandersHeaderProps {
  commanders: Card[];
  cardSize: CardSize;
  viewMode: 'list' | 'grid' | 'stack';
  isRemovable: boolean;
  onHoverEnter: (card: Card, e: React.MouseEvent) => void;
  onHoverMove: (e: React.MouseEvent) => void;
  onHoverLeave: () => void;
  onToggleCommander: (card: Card) => void;
  onAddToDeck: (card: Card) => void;
  onRemoveFromDeck: (card: Card) => void;
  onCardSelect: (card: Card) => void;
}

function DeckCommandersHeader({
  commanders,
  cardSize,
  viewMode,
  isRemovable,
  onHoverEnter,
  onHoverMove,
  onHoverLeave,
  onToggleCommander,
  onAddToDeck,
  onRemoveFromDeck,
  onCardSelect
}: DeckCommandersHeaderProps) {
  const { t } = useTranslation();

  if (commanders.length === 0) return null;

  const countBadge = (
    <span className="text-xs bg-amber-200/50 dark:bg-amber-900/50 px-2 py-0.5 rounded-full text-amber-800 dark:text-amber-300">
      {commanders.length}
    </span>
  );

  const header = (
    <h4 className="text-sm font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-amber-255 dark:border-amber-900/50 pb-1.5 select-none">
      <FaCrown className="text-amber-500 shrink-0 text-sm animate-pulse" />
      <span>{t('commanders')}</span>
      {countBadge}
    </h4>
  );

  if (viewMode === 'grid') {
    return (
      <div className="space-y-3 mb-6 bg-amber-500/5 dark:bg-amber-950/10 p-4 rounded-xl border border-amber-300/40 dark:border-amber-900/40 shadow-sm">
        {header}
        <CardGrid
          cards={commanders}
          size={cardSize}
          onAddToDeck={isRemovable ? onAddToDeck : undefined}
          onRemoveFromDeck={isRemovable ? onRemoveFromDeck : undefined}
          showRemoveButton={isRemovable}
        />
      </div>
    );
  }

  const uniqueCommanders = groupCardsByUnique(commanders);

  return (
    <div className="space-y-2 mb-6 bg-amber-500/5 dark:bg-amber-950/10 p-4 rounded-xl border border-amber-300/40 dark:border-amber-900/40 shadow-sm text-left">
      {header}
      <div className="deck-list-compact">
        {uniqueCommanders.map(({ count, card }) => {
          return (
            <div key={card.id} className="animate-fadeIn">
              <div
                className="deck-list-row border-l-2 border-amber-400 group bg-amber-500/5 dark:bg-amber-950/5 hover:bg-amber-500/10 dark:hover:bg-amber-950/15"
                onClick={() => onCardSelect(card)}
                onMouseEnter={(e) => onHoverEnter(card, e)}
                onMouseMove={onHoverMove}
                onMouseLeave={onHoverLeave}
              >
                <div className="flex items-center min-w-0 pr-2">
                  <span className="quantity-badge bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-900">
                    {count}x
                  </span>
                  <span className="font-semibold truncate text-sm text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    {card.printed_name || card.name}
                  </span>
                  <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50 shrink-0 shadow-sm animate-pulse">
                    <FaCrown className="text-amber-500 dark:text-amber-400 shrink-0 text-[10px]" />
                    {t('commanderBadge')}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {card.mana_cost && (
                    <span className="flex items-center gap-0.5 mr-2">{parseTextWithSymbols(card.mana_cost)}</span>
                  )}

                  {/* Quick Edit Buttons on Hover */}
                  {isRemovable && (
                    <div
                      className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => onToggleCommander(card)}
                        className="w-6 h-6 rounded-full flex items-center justify-center bg-amber-100 dark:bg-amber-900/50 border border-amber-350 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-500 hover:text-white transition-all shadow-sm"
                        title={t('removeAsCommander')}
                      >
                        <FaCrown className="text-[10px]" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onAddToDeck(card)}
                        className="w-6 h-6 rounded-full flex items-center justify-center bg-green-50 dark:bg-green-950/60 border border-green-300 dark:border-green-900/60 text-green-600 dark:text-green-400 hover:bg-green-500 hover:text-white transition-all font-bold shadow-sm"
                        title={t('addCopy')}
                      >
                        <FaPlus className="text-[8px]" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onRemoveFromDeck(card)}
                        className="w-6 h-6 rounded-full flex items-center justify-center bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-900/60 text-amber-600 dark:text-amber-400 hover:bg-amber-500 hover:text-white transition-all font-bold shadow-sm"
                        title={t('removeCopy')}
                      >
                        <FaMinus className="text-[8px]" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          for (let copyIndex = 0; copyIndex < count; copyIndex++) {
                            onRemoveFromDeck(card);
                          }
                        }}
                        className="w-6 h-6 rounded-full flex items-center justify-center bg-red-50 dark:bg-red-950/60 border border-red-300 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white transition-all font-bold shadow-sm"
                        title={t('deleteCard')}
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
}

export default DeckCommandersHeader;
