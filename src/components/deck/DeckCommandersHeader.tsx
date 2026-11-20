import { useTranslation } from 'react-i18next';
import { FaCrown, FaPlus, FaMinus, FaTrash } from 'react-icons/fa';
import { Card } from '../../types/Card';
import { CardSize } from '../../types';
import { groupCardsByUnique } from '../../utils/deckGrouping';
import { parseTextWithSymbols } from '../../utils/symbolHelper';
import CardGrid from '../card/CardGrid';

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
  onUpdateCard?: (updatedCard: Card) => void;
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
  onCardSelect,
  onUpdateCard
}: DeckCommandersHeaderProps) {
  const { t } = useTranslation();

  if (commanders.length === 0) return null;

  const countBadge = (
    <span className="text-xs bg-warning-soft px-2 py-0.5 rounded-full text-warning">{commanders.length}</span>
  );

  const header = (
    <h4 className="text-sm font-bold text-warning uppercase tracking-wider flex items-center gap-1.5 border-b border-warning/40 pb-1.5 select-none">
      <FaCrown className="text-warning shrink-0 text-sm animate-pulse" />
      <span>{t('cardDetails.commanders')}</span>
      {countBadge}
    </h4>
  );

  if (viewMode === 'grid') {
    return (
      <div className="space-y-3 mb-6 bg-warning-soft p-4 rounded-xl border border-warning/40 shadow-sm">
        {header}
        <CardGrid
          cards={commanders}
          size={cardSize}
          onAddToDeck={isRemovable ? onAddToDeck : undefined}
          onRemoveFromDeck={isRemovable ? onRemoveFromDeck : undefined}
          showRemoveButton={isRemovable}
          isDeckCard={true}
          deckCards={commanders}
          onSelectPrint={onUpdateCard}
          isEditMode={isRemovable}
        />
      </div>
    );
  }

  const uniqueCommanders = groupCardsByUnique(commanders);

  return (
    <div className="space-y-2 mb-6 bg-warning-soft p-4 rounded-xl border border-warning/40 shadow-sm text-left">
      {header}
      <div className="deck-list-compact">
        {uniqueCommanders.map(({ count, card }) => {
          return (
            <div key={card.id} className="animate-fadeIn">
              <div
                role="button"
                tabIndex={0}
                aria-label={card.printed_name || card.name}
                className="deck-list-row border-l-2 border-warning group bg-warning-soft hover:bg-warning-soft"
                onClick={() => onCardSelect(card)}
                onKeyDown={(e) => {
                  if (e.target !== e.currentTarget) return;
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onCardSelect(card);
                  }
                }}
                onMouseEnter={(e) => onHoverEnter(card, e)}
                onMouseMove={onHoverMove}
                onMouseLeave={onHoverLeave}
              >
                <div className="flex items-center min-w-0 pr-2">
                  <span className="quantity-badge bg-warning-soft text-warning border-warning/40">{count}x</span>
                  <span className="font-semibold truncate text-sm text-fg hover:text-accent transition-colors">
                    {card.printed_name || card.name}
                  </span>
                  <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-warning-soft text-warning border border-warning/40 shrink-0 shadow-sm animate-pulse">
                    <FaCrown className="text-warning shrink-0 text-[10px]" />
                    {t('cardDetails.commanderBadge')}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {card.mana_cost && (
                    <span className="flex items-center gap-0.5 mr-2">{parseTextWithSymbols(card.mana_cost)}</span>
                  )}

                  {/* Quick Edit Buttons on Hover */}
                  {isRemovable && (
                    // Only guards against triggering the row's onCardSelect; the buttons inside are the real interactive surface.
                    // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
                    <div
                      className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => onToggleCommander(card)}
                        className="w-6 h-6 rounded-full flex items-center justify-center bg-warning-soft border border-warning text-warning hover:bg-warning hover:text-white transition-all shadow-sm"
                        title={t('cardDetails.removeAsCommander')}
                      >
                        <FaCrown className="text-[10px]" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onAddToDeck(card)}
                        className="w-6 h-6 rounded-full flex items-center justify-center bg-success-soft border border-success/40 text-success dark:text-success hover:bg-success hover:text-white transition-all font-bold shadow-sm"
                        title={t('cardDetails.addCopy')}
                      >
                        <FaPlus className="text-[8px]" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onRemoveFromDeck(card)}
                        className="w-6 h-6 rounded-full flex items-center justify-center bg-warning-soft border border-warning/40 text-warning dark:text-warning hover:bg-warning hover:text-white transition-all font-bold shadow-sm"
                        title={t('cardDetails.removeCopy')}
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
                        className="w-6 h-6 rounded-full flex items-center justify-center bg-danger-soft border border-danger/40 text-danger dark:text-danger hover:bg-danger hover:text-white transition-all font-bold shadow-sm"
                        title={t('cardDetails.deleteCard')}
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
