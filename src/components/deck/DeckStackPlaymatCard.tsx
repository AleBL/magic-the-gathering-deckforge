import { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { LuBan, LuCircleX, LuMinus, LuPlus, LuTriangleAlert } from 'react-icons/lu';
import { Card } from '../../types/Card';
import { DeckZone } from '../../types/enums';
import { DeckFormat } from '../../types/Deck';
import { getCardImageUrl } from '../../utils/deckGrouping';
import { cardFormatStatus } from '../../utils/deckValidator';

interface DeckStackPlaymatCardProps {
  readonly item: { name: string; count: number; card: Card };
  readonly cardDimensions: { width: string; height: string };
  readonly isRemovable: boolean;
  readonly activeFormat?: DeckFormat;
  readonly onSelectCard: (card: Card) => void;
  readonly onHoverEnter: (card: Card, e: React.MouseEvent) => void;
  readonly onHoverMove: (e: React.MouseEvent) => void;
  readonly onHoverLeave: () => void;
  readonly onAddToDeck: (card: Card) => void;
  readonly onRemoveFromDeck: (card: Card) => void;
  readonly onUpdateCardZone?: (cardId: string, zone: DeckZone) => void;
}

/** One card tile in the playmat stack: art, count badge, legality badge, and hover-only zone controls. */
export function DeckStackPlaymatCard({
  item,
  cardDimensions,
  isRemovable,
  activeFormat,
  onSelectCard,
  onHoverEnter,
  onHoverMove,
  onHoverLeave,
  onAddToDeck,
  onRemoveFromDeck,
  onUpdateCardZone
}: DeckStackPlaymatCardProps) {
  const { t } = useTranslation();
  const { count, card } = item;
  const imageUrl = getCardImageUrl(card);
  const status = cardFormatStatus(card, activeFormat);
  const isBanned = status === 'banned';
  const isRestricted = status === 'restricted';
  const isInvalid = status === 'invalid';
  const dynamicCardStyle = {
    '--stack-card-width': cardDimensions.width,
    '--stack-card-height': cardDimensions.height
  } as CSSProperties;

  return (
    <div
      key={card.id}
      className="deck-stack-card-wrapper group"
      data-stack-depth={count > 2 ? '3' : count > 1 ? '2' : '1'}
      style={dynamicCardStyle}
    >
      {count > 1 ? (
        <div
          className={`deck-stack-shadow deck-stack-shadow-level-one ${
            isBanned
              ? 'bg-danger border border-danger'
              : isRestricted
                ? 'bg-warning-soft border border-warning/40 '
                : 'bg-surface-3 border border-gray-400/80 dark:border-slate-800/80'
          }`}
        />
      ) : null}

      {count > 2 ? (
        <div
          className={`deck-stack-shadow deck-stack-shadow-level-two ${
            isBanned
              ? 'bg-danger-soft border border-danger/40'
              : isRestricted
                ? 'bg-warning-soft border border-warning/40 '
                : 'bg-surface-3 border border-line-strong '
          }`}
        />
      ) : null}

      <div
        role="button"
        tabIndex={0}
        aria-label={card.printed_name || card.name}
        className={`deck-stack-main-card ${
          isBanned
            ? 'border-danger shadow-[0_0_10px_rgba(239,68,68,0.5)]'
            : isRestricted
              ? 'border-warning shadow-[0_0_10px_rgba(245,158,11,0.4)]'
              : 'border-line-strong hover:border-accent/50'
        }`}
        data-has-stack={count > 1 ? 'true' : 'false'}
        onClick={() => onSelectCard(card)}
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelectCard(card);
          }
        }}
        onMouseEnter={(e) => onHoverEnter(card, e)}
        onMouseMove={onHoverMove}
        onMouseLeave={onHoverLeave}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={card.name}
            className={`w-full h-full object-cover pointer-events-none select-none transition-all duration-300 ${
              isBanned ? 'opacity-50 grayscale-[40%] brightness-[75%]' : ''
            }`}
          />
        ) : (
          <div
            className={`p-2.5 text-left h-full flex flex-col justify-between ${isBanned ? 'bg-danger-soft ' : 'bg-surface-2 '}`}
          >
            <span
              className={`text-[10px] font-semibold block leading-tight truncate-2-lines ${isBanned ? 'text-danger ' : 'text-fg '}`}
            >
              {card.printed_name || card.name}
            </span>
            <span className="text-[9px] text-warning font-mono font-semibold">{card.mana_cost}</span>
          </div>
        )}

        {count > 1 ? <span className="deck-stack-count-badge">{count}x</span> : null}

        {isBanned ? (
          <div className="deck-stack-status-badge deck-stack-status-badge-banned animate-pulse">
            <LuBan className="text-white text-[8px] shrink-0" />
            <span>{t('cardDetails.banned')}</span>
          </div>
        ) : null}

        {isRestricted ? (
          <div className="deck-stack-status-badge deck-stack-status-badge-restricted">
            <LuTriangleAlert className="text-white text-[8px] shrink-0" />
            <span>{t('cardDetails.restricted')}</span>
          </div>
        ) : null}

        {isInvalid ? (
          <div
            className="deck-stack-status-badge bg-surface-3 border border-accent/50"
            title={t('cardDetails.invalidInFormatHint')}
          >
            <LuCircleX className="text-white text-[8px] shrink-0" />
            <span>{t('cardDetails.invalidInFormat')}</span>
          </div>
        ) : null}

        {isRemovable ? (
          <div className="absolute top-1.5 right-1.5 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-20 items-end">
            <div className="flex gap-1.5 bg-black/40 backdrop-blur-md p-1 rounded-full border border-white/10 shadow-lg">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToDeck(card);
                }}
                className="w-6 h-6 rounded-full bg-success/90 text-white flex items-center justify-center text-xs font-semibold hover:bg-success hover:scale-110 transition-all pointer-events-auto"
                title={t('cardDetails.addCopy')}
              >
                <LuPlus className="text-[10px]" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveFromDeck(card);
                }}
                className="w-6 h-6 rounded-full bg-danger/90 text-white flex items-center justify-center text-xs font-semibold hover:bg-danger hover:scale-110 transition-all pointer-events-auto"
                title={t('cardDetails.removeCopy')}
              >
                <LuMinus className="text-[10px]" />
              </button>
            </div>

            {onUpdateCardZone && card.zone ? (
              <div className="flex gap-1 bg-black/40 backdrop-blur-md p-1 rounded-full border border-white/10 shadow-lg pointer-events-auto mt-1 flex-col items-center">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateCardZone(card.id, DeckZone.MAIN);
                  }}
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-semibold transition-all ${
                    card.zone === DeckZone.MAIN
                      ? 'bg-primary text-on-primary ring-1 ring-white/50'
                      : 'bg-slate-700/80 text-gray-300 hover:bg-surface-3 hover:text-white'
                  }`}
                  title={t('deck.printFilters.main')}
                >
                  M
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateCardZone(card.id, DeckZone.SIDEBOARD);
                  }}
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-semibold transition-all ${
                    card.zone === DeckZone.SIDEBOARD
                      ? 'bg-surface-3 text-fg ring-1 ring-white/50'
                      : 'bg-slate-700/80 text-gray-300 hover:bg-surface-3 hover:text-white'
                  }`}
                  title={t('deck.printFilters.sideboard')}
                >
                  S
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateCardZone(card.id, DeckZone.MAYBEBOARD);
                  }}
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-semibold transition-all ${
                    card.zone === DeckZone.MAYBEBOARD
                      ? 'bg-warning text-white ring-1 ring-white/50'
                      : 'bg-slate-700/80 text-gray-300 hover:bg-warning hover:text-on-warning'
                  }`}
                  title={t('deck.printFilters.maybeboard')}
                >
                  ?
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
