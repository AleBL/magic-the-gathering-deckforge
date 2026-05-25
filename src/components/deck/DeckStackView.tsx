import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FaFistRaised, FaMagic, FaBolt, FaTint } from 'react-icons/fa';
import { Card } from '../../types/Card';
import { CardSize } from '../../types';
import { GroupedCards, groupCardsByUnique, getCardImageUrl } from '../../utils/deckGrouping';
import CardDetailModal from '../CardDetailModal';

interface DeckStackViewProps {
  groups: GroupedCards[];
  cardSize: CardSize;
  isRemovable: boolean;
  onHoverEnter: (card: Card, e: React.MouseEvent) => void;
  onHoverMove: (e: React.MouseEvent) => void;
  onHoverLeave: () => void;
  onRemoveFromDeck: (card: Card) => void;
  onAddToDeck: (card: Card) => void;
}

const CARD_DIMENSIONS: Record<CardSize, { width: string; height: string }> = {
  small: { width: '84px', height: '118px' },
  medium: { width: '112px', height: '157px' },
  large: { width: '140px', height: '196px' },
  xlarge: { width: '168px', height: '235px' }
};

function DeckStackView({
  groups,
  cardSize,
  isRemovable,
  onHoverEnter,
  onHoverMove,
  onHoverLeave,
  onRemoveFromDeck,
  onAddToDeck
}: DeckStackViewProps) {
  const { t } = useTranslation();
  const [selectedModalCard, setSelectedModalCard] = useState<Card | null>(null);

  // Flatten all cards from groups
  const allCards = useMemo(() => groups.flatMap((g) => g.cards), [groups]);

  // 1. Frontline (Creatures & Planeswalkers)
  const frontline = useMemo(
    () =>
      allCards.filter(
        (c) => c.type_line?.toLowerCase().includes('creature') || c.type_line?.toLowerCase().includes('planeswalker')
      ),
    [allCards]
  );

  // 2. Backline / Support (Artifacts & Enchantments that are not Creatures or Lands)
  const backline = useMemo(
    () =>
      allCards.filter(
        (c) =>
          (c.type_line?.toLowerCase().includes('artifact') || c.type_line?.toLowerCase().includes('enchantment')) &&
          !c.type_line?.toLowerCase().includes('creature') &&
          !c.type_line?.toLowerCase().includes('land')
      ),
    [allCards]
  );

  // 3. Mana Resources (Lands)
  const lands = useMemo(() => allCards.filter((c) => c.type_line?.toLowerCase().includes('land')), [allCards]);

  // 4. Spells (Sorceries & Instants, etc.)
  const spells = useMemo(
    () =>
      allCards.filter(
        (c) =>
          !c.type_line?.toLowerCase().includes('creature') &&
          !c.type_line?.toLowerCase().includes('planeswalker') &&
          !c.type_line?.toLowerCase().includes('land') &&
          !c.type_line?.toLowerCase().includes('artifact') &&
          !c.type_line?.toLowerCase().includes('enchantment')
      ),
    [allCards]
  );

  // Group unique cards in each category
  const frontlineUnique = useMemo(() => groupCardsByUnique(frontline), [frontline]);
  const backlineUnique = useMemo(() => groupCardsByUnique(backline), [backline]);
  const spellsUnique = useMemo(() => groupCardsByUnique(spells), [spells]);
  const landsUnique = useMemo(() => groupCardsByUnique(lands), [lands]);

  const dim = CARD_DIMENSIONS[cardSize];

  const renderPlaymatCard = (item: { name: string; count: number; card: Card }) => {
    const { count, card } = item;
    const imageUrl = getCardImageUrl(card);

    return (
      <div
        key={card.id}
        className="relative group cursor-pointer shrink-0"
        style={{
          width: dim.width,
          height: dim.height,
          paddingRight: count > 1 ? '10px' : '0px',
          paddingBottom: count > 1 ? '10px' : '0px'
        }}
      >
        {/* Shadow card layer 1 behind the main card (physically offset stack style) */}
        {count > 1 && (
          <div
            className="absolute bg-slate-950 border border-slate-800/80 rounded-lg shadow-sm pointer-events-none transition-all duration-300 group-hover:translate-x-1.5 group-hover:translate-y-1.5"
            style={{
              top: '4px',
              left: '4px',
              width: `calc(${dim.width} - 10px)`,
              height: `calc(${dim.height} - 10px)`,
              zIndex: 1
            }}
          />
        )}

        {/* Shadow card layer 2 behind the main card (offset stack style) */}
        {count > 2 && (
          <div
            className="absolute bg-slate-950 border border-slate-800/80 rounded-lg shadow-sm pointer-events-none transition-all duration-300 group-hover:translate-x-2.5 group-hover:translate-y-2.5"
            style={{
              top: '8px',
              left: '8px',
              width: `calc(${dim.width} - 10px)`,
              height: `calc(${dim.height} - 10px)`,
              zIndex: 2
            }}
          />
        )}

        {/* Main Card */}
        <div
          className="absolute inset-y-0 left-0 rounded-lg overflow-hidden border border-slate-700/40 dark:border-slate-800/50 bg-slate-900 shadow-md transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-xl hover:border-blue-500/80"
          style={{
            width: `calc(${dim.width} - ${count > 1 ? '10px' : '0px'})`,
            height: `calc(${dim.height} - ${count > 1 ? '10px' : '0px'})`,
            zIndex: 3
          }}
          onClick={() => setSelectedModalCard(card)}
          onMouseEnter={(e) => onHoverEnter(card, e)}
          onMouseMove={onHoverMove}
          onMouseLeave={onHoverLeave}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={card.name}
              className="w-full h-full object-cover pointer-events-none select-none"
            />
          ) : (
            <div className="p-2.5 text-left h-full flex flex-col justify-between bg-slate-850">
              <span className="text-[10px] font-extrabold block leading-tight text-white truncate-2-lines">
                {card.printed_name || card.name}
              </span>
              <span className="text-[9px] text-yellow-500 font-mono font-bold">{card.mana_cost}</span>
            </div>
          )}

          {/* Count Badge in lower corner */}
          {count > 1 && (
            <span className="absolute bottom-1.5 right-1.5 bg-blue-600 border border-blue-400 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full shadow-md z-10 select-none pointer-events-none">
              {count}x
            </span>
          )}

          {/* Fast circular Remove button on hover */}
          {isRemovable && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveFromDeck(card);
              }}
              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600/90 text-white flex items-center justify-center text-[9px] font-extrabold opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-700 z-20"
              title={t('removeCopy')}
            >
              ✕
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 p-6 bg-slate-900/20 dark:bg-slate-950/30 border border-gray-250 dark:border-slate-800 rounded-2xl shadow-xl backdrop-blur-xs select-none">
      {/* 1. Combat Zone (Frontline) */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-amber-300/30 dark:border-amber-900/30 pb-1.5 select-none text-left">
          <FaFistRaised className="text-amber-500 shrink-0 text-xs" />
          <span>
            {t('frontline')} ({t('creature')} & {t('planeswalker')})
          </span>
          <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full font-bold">
            {frontline.length}
          </span>
        </h4>
        {frontlineUnique.length === 0 ? (
          <p className="text-xs text-gray-400 dark:text-gray-500 italic py-4 text-left">{t('emptyZone')}</p>
        ) : (
          <div className="flex flex-row overflow-x-auto gap-5 py-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
            {frontlineUnique.map((item) => renderPlaymatCard(item))}
          </div>
        )}
      </div>

      {/* 2. Support Zone (Backline) */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-indigo-300/30 dark:border-indigo-900/30 pb-1.5 select-none text-left">
          <FaMagic className="text-indigo-500 shrink-0 text-xs" />
          <span>
            {t('backline')} ({t('artifact')} & {t('enchantment')})
          </span>
          <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full font-bold">
            {backline.length}
          </span>
        </h4>
        {backlineUnique.length === 0 ? (
          <p className="text-xs text-gray-400 dark:text-gray-500 italic py-4 text-left">{t('emptyZone')}</p>
        ) : (
          <div className="flex flex-row overflow-x-auto gap-5 py-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
            {backlineUnique.map((item) => renderPlaymatCard(item))}
          </div>
        )}
      </div>

      {/* 3. Spells Zone */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-cyan-300/30 dark:border-cyan-900/30 pb-1.5 select-none text-left">
          <FaBolt className="text-cyan-500 shrink-0 text-xs" />
          <span>
            {t('spells')} ({t('instant')} & {t('sorcery')})
          </span>
          <span className="text-[10px] bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 px-2 py-0.5 rounded-full font-bold">
            {spells.length}
          </span>
        </h4>
        {spellsUnique.length === 0 ? (
          <p className="text-xs text-gray-400 dark:text-gray-500 italic py-4 text-left">{t('emptyZone')}</p>
        ) : (
          <div className="flex flex-row overflow-x-auto gap-5 py-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
            {spellsUnique.map((item) => renderPlaymatCard(item))}
          </div>
        )}
      </div>

      {/* 4. Lands Zone (Resource Zone) */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-emerald-300/30 dark:border-emerald-900/30 pb-1.5 select-none text-left">
          <FaTint className="text-emerald-500 shrink-0 text-xs" />
          <span>
            {t('resourceLands')} ({t('land')})
          </span>
          <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold">
            {lands.length}
          </span>
        </h4>
        {landsUnique.length === 0 ? (
          <p className="text-xs text-gray-400 dark:text-gray-500 italic py-4 text-left">{t('emptyZone')}</p>
        ) : (
          <div className="flex flex-row overflow-x-auto gap-5 py-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
            {landsUnique.map((item) => renderPlaymatCard(item))}
          </div>
        )}
      </div>

      {selectedModalCard && (
        <CardDetailModal
          card={selectedModalCard}
          imageUrl={getCardImageUrl(selectedModalCard)}
          onAddToDeck={isRemovable ? onAddToDeck : undefined}
          onClose={() => setSelectedModalCard(null)}
        />
      )}
    </div>
  );
}

export default DeckStackView;
