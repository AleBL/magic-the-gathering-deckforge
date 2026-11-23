import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { LuEllipsis, LuInfo } from 'react-icons/lu';
import { usePlaytestContext } from './PlaytestContext';
import { Card } from '../../types/Card';
import { PlaytestCard, PlaytestDragData } from '../../types/Playtest';
import { PLAYTEST_HAND_CARD_SIZE_CLASSES, PLAYTEST_CONTEXT_MENU_EDGE_MARGIN_PX } from '../../constants';
import { clampMenuYToViewport } from '../../utils/contextMenuPosition';

const PlaytestHandCard = memo(
  ({
    playtestCard,
    imageUrl,
    isSelected,
    isMulliganPhase,
    onPlayCard,
    onToggleSelection,
    onContextMenu,
    onShowDetails
  }: {
    playtestCard: PlaytestCard;
    imageUrl: string;
    isSelected: boolean;
    isMulliganPhase: boolean;
    onPlayCard: (id: string) => void;
    onToggleSelection: (id: string) => void;
    onContextMenu: (e: React.MouseEvent, id: string) => void;
    onShowDetails: (card: Card) => void;
  }) => {
    const { t } = useTranslation();
    const { playtestId, card } = playtestCard;

    return (
      <div className="group relative">
        <div
          role="button"
          tabIndex={0}
          aria-label={card.printed_name || card.name}
          onClick={() => {
            if (isMulliganPhase) {
              onToggleSelection(playtestId);
            } else {
              onPlayCard(playtestId);
            }
          }}
          onKeyDown={(e) => {
            if (e.key !== 'Enter' && e.key !== ' ') return;
            e.preventDefault();
            if (isMulliganPhase) {
              onToggleSelection(playtestId);
            } else {
              onPlayCard(playtestId);
            }
          }}
          draggable={!isMulliganPhase}
          onDragStart={(event) => {
            event.dataTransfer.setData('text/plain', JSON.stringify({ id: playtestId, source: 'hand' }));
            event.dataTransfer.effectAllowed = 'move';
            (event.currentTarget as HTMLElement).style.opacity = '0.4';
          }}
          onDragEnd={(event) => {
            (event.currentTarget as HTMLElement).style.opacity = '1';
          }}
          onContextMenu={(event) => onContextMenu(event, playtestId)}
          className={`relative ${PLAYTEST_HAND_CARD_SIZE_CLASSES} rounded-xl overflow-hidden shadow-lg border bg-slate-900 transition-[transform,border-color] duration-150 select-none cursor-pointer ${isMulliganPhase ? 'hover:border-warning' : 'hover:-translate-y-1 hover:border-accent'} ${isSelected ? 'border-warning ring-2 ring-warning/40 scale-95 opacity-80' : 'border-line-strong '}`}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={card.name}
              className="w-full h-full object-cover pointer-events-none"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full p-2 flex flex-col justify-between text-left bg-slate-800">
              <span className="text-[11px] font-semibold text-white bg-black/50 p-1 rounded leading-tight line-clamp-3 shadow-md">
                {card.printed_name || card.name}
              </span>
              <span className="text-[9px] font-semibold text-slate-400 capitalize">
                {t(`search.${card.rarity}`, { defaultValue: card.rarity })}
              </span>
            </div>
          )}

          {isMulliganPhase ? (
            <div
              className={`absolute inset-0 flex items-center justify-center transition-all ${isSelected ? 'bg-warning-soft' : 'bg-black/10 hover:bg-black/0'}`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center font-semibold text-xs border ${isSelected ? 'bg-warning border-warning text-slate-950 animate-pulse' : 'bg-slate-900/80 border-slate-700 text-slate-400'}`}
              >
                {isSelected ? '✓' : ''}
              </div>
            </div>
          ) : null}
        </div>

        {!isMulliganPhase ? (
          <>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onShowDetails(card);
              }}
              title={t('cardDetails.viewCardDetails')}
              className="touch-hitarea absolute -top-3 -left-2.5 sm:-top-2.5 sm:-left-2 w-7 h-7 sm:w-5.5 sm:h-5.5 rounded-full flex items-center justify-center bg-slate-900 border border-slate-800 shadow-lg text-slate-400 hover:text-accent hover:border-line-strong opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-20 text-[9px] sm:text-[8px] cursor-pointer"
            >
              <LuInfo />
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onContextMenu(event, playtestId);
              }}
              title={t('common.moreActions')}
              className="touch-hitarea absolute -top-3 -right-2.5 sm:-top-2.5 sm:-right-2 w-7 h-7 sm:w-5.5 sm:h-5.5 rounded-full flex items-center justify-center bg-slate-900 border border-slate-800 shadow-lg text-slate-400 hover:text-slate-200 hover:border-slate-600 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-20 text-[9px] sm:text-[8px] cursor-pointer"
            >
              <LuEllipsis />
            </button>
          </>
        ) : null}
      </div>
    );
  }
);

PlaytestHandCard.displayName = 'PlaytestHandCard';

export function PlaytestHand() {
  const { t } = useTranslation();
  const {
    hand,
    dragOverZone,
    setDragOverZone,
    handleReturnToHand,
    handlePlayCard,
    handleToggleCardSelection,
    setContextMenu,
    isMulliganPhase,
    selectedToBottom,
    getCardImageUrl,
    setSelectedDetailCard
  } = usePlaytestContext();

  const handleContextMenu = (e: React.MouseEvent, playtestId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const y = clampMenuYToViewport(e.clientY, 220, PLAYTEST_CONTEXT_MENU_EDGE_MARGIN_PX);
    setContextMenu({ playtestId, x: e.clientX, y, zone: 'hand' });
  };

  return (
    <div
      className={`shrink-0 border rounded-2xl p-3 transition-colors duration-150 ${
        dragOverZone === 'hand'
          ? 'border-2 border-dashed border-success bg-success-soft shadow-lg ring-2 ring-success/40'
          : 'border-line bg-surface-1 '
      }`}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        if (dragOverZone !== 'hand') setDragOverZone('hand');
      }}
      onDragLeave={() => setDragOverZone(null)}
      onDrop={(event) => {
        event.preventDefault();
        setDragOverZone(null);
        try {
          const data = JSON.parse(event.dataTransfer.getData('text/plain')) as PlaytestDragData;
          if (data.source === 'battlefield') handleReturnToHand(data.id, 'battlefield');
        } catch {
          // ignoring format errors
        }
      }}
    >
      <div className="flex items-center justify-between mb-2 sm:mb-3 text-[11px] sm:text-xs font-semibold text-slate-500 select-none">
        <span>
          {t('playtest.hand')} ({hand.length})
        </span>
        {!isMulliganPhase && hand.length > 0 ? (
          <span className="text-[9px] sm:text-[10px] text-fg-muted normal-case font-normal">
            {t('playtest.clickCardHint')}
          </span>
        ) : null}
      </div>

      <div className="flex items-start justify-start min-h-[140px] p-2 pt-3 bg-surface-2 rounded-xl border border-line overflow-x-auto">
        {hand.length === 0 ? (
          <p className="text-xs text-slate-600 italic py-4">{t('playtest.handEmpty')}</p>
        ) : (
          <div className="flex flex-nowrap gap-3 items-start justify-start">
            {hand.map((playtestCard) => (
              <PlaytestHandCard
                key={playtestCard.playtestId}
                playtestCard={playtestCard}
                imageUrl={getCardImageUrl(playtestCard.card)}
                isSelected={selectedToBottom.has(playtestCard.playtestId)}
                isMulliganPhase={isMulliganPhase}
                onPlayCard={handlePlayCard}
                onToggleSelection={handleToggleCardSelection}
                onContextMenu={handleContextMenu}
                onShowDetails={setSelectedDetailCard}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
