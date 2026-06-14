import { CSSProperties, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaFistRaised, FaMagic, FaBolt, FaTint, FaBan, FaExclamationTriangle, FaPalette } from 'react-icons/fa';
import { Card } from '../../types/Card';
import { CardSize } from '../../types';
import { DeckFormat } from '../../types/Deck';
import { DeckCardGrouped, GroupedCards, groupCardsByUnique, getCardImageUrl } from '../../utils/deckGrouping';
import { isBacklineSupportCard, isFrontlineCard, isLandCard, isSpellCard } from '../../utils/cardTypePredicates';
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
  onAddTokenToDeck?: (token: Card) => void;
  activeFormat?: DeckFormat;
  onUpdateCard?: (updatedCard: Card) => void;
  isTokenZone?: boolean;
}

interface PlaymatSection {
  sectionId: 'frontline' | 'backline' | 'spells' | 'lands';
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  cards: Card[];
  groupedCards: DeckCardGrouped[];
  accentClassName: string;
}

const CARD_DIMENSIONS_BY_SIZE: Record<CardSize, { width: string; height: string }> = {
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
  onAddToDeck,
  onAddTokenToDeck,
  activeFormat,
  onUpdateCard,
  isTokenZone = false
}: DeckStackViewProps) {
  const { t } = useTranslation();
  const [selectedModalCard, setSelectedModalCard] = useState<Card | null>(null);

  const allCardsInDeck = useMemo(() => groups.flatMap((groupedCards) => groupedCards.cards), [groups]);
  const cardDimensions = CARD_DIMENSIONS_BY_SIZE[cardSize];

  const handleUpdateCard = (updatedCard: Card) => {
    setSelectedModalCard(updatedCard);
    onUpdateCard?.(updatedCard);
  };

  const frontlineCards = useMemo(() => allCardsInDeck.filter(isFrontlineCard), [allCardsInDeck]);
  const backlineCards = useMemo(() => allCardsInDeck.filter(isBacklineSupportCard), [allCardsInDeck]);
  const spellCards = useMemo(() => allCardsInDeck.filter(isSpellCard), [allCardsInDeck]);
  const landCards = useMemo(() => allCardsInDeck.filter(isLandCard), [allCardsInDeck]);

  const playmatSections: PlaymatSection[] = useMemo(
    () => [
      {
        sectionId: 'frontline',
        icon: FaFistRaised,
        title: t('frontline'),
        subtitle: `${t('creature')} & ${t('planeswalker')}`,
        cards: frontlineCards,
        groupedCards: groupCardsByUnique(frontlineCards),
        accentClassName: 'deck-stack-zone-frontline'
      },
      {
        sectionId: 'backline',
        icon: FaMagic,
        title: t('backline'),
        subtitle: `${t('artifact')} & ${t('enchantment')}`,
        cards: backlineCards,
        groupedCards: groupCardsByUnique(backlineCards),
        accentClassName: 'deck-stack-zone-backline'
      },
      {
        sectionId: 'spells',
        icon: FaBolt,
        title: t('spells'),
        subtitle: `${t('instant')} & ${t('sorcery')}`,
        cards: spellCards,
        groupedCards: groupCardsByUnique(spellCards),
        accentClassName: 'deck-stack-zone-spells'
      },
      {
        sectionId: 'lands',
        icon: FaTint,
        title: t('resourceLands'),
        subtitle: t('land'),
        cards: landCards,
        groupedCards: groupCardsByUnique(landCards),
        accentClassName: 'deck-stack-zone-lands'
      }
    ],
    [t, frontlineCards, backlineCards, spellCards, landCards]
  );

  function getCardLegalityStatus(card: Card): { isBanned: boolean; isRestricted: boolean } {
    if (!activeFormat || activeFormat === 'freeform') {
      return { isBanned: false, isRestricted: false };
    }

    const legalityStatus = card.legalities?.[activeFormat as keyof typeof card.legalities];
    return {
      isBanned: legalityStatus === 'banned',
      isRestricted: legalityStatus === 'restricted'
    };
  }

  const renderPlaymatCard = (item: { name: string; count: number; card: Card }) => {
    const { count, card } = item;
    const imageUrl = getCardImageUrl(card);
    const { isBanned, isRestricted } = getCardLegalityStatus(card);
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
        {count > 1 && (
          <div
            className={`deck-stack-shadow deck-stack-shadow-level-one ${
              isBanned
                ? 'bg-red-950/60 border border-red-900/60'
                : isRestricted
                  ? 'bg-amber-950/60 border border-amber-900/60'
                  : 'bg-slate-950 border border-slate-800/80'
            }`}
          />
        )}

        {count > 2 && (
          <div
            className={`deck-stack-shadow deck-stack-shadow-level-two ${
              isBanned
                ? 'bg-red-950/40 border border-red-900/40'
                : isRestricted
                  ? 'bg-amber-950/40 border border-amber-900/40'
                  : 'bg-slate-950 border border-slate-800/80'
            }`}
          />
        )}

        <div
          className={`deck-stack-main-card ${
            isBanned
              ? 'border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'
              : isRestricted
                ? 'border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                : 'border-slate-700/40 dark:border-slate-800/50 hover:border-blue-500/80'
          }`}
          data-has-stack={count > 1 ? 'true' : 'false'}
          onClick={() => setSelectedModalCard(card)}
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
              className={`p-2.5 text-left h-full flex flex-col justify-between ${isBanned ? 'bg-red-950/20' : 'bg-slate-850'}`}
            >
              <span
                className={`text-[10px] font-extrabold block leading-tight truncate-2-lines ${isBanned ? 'text-red-400' : 'text-white'}`}
              >
                {card.printed_name || card.name}
              </span>
              <span className="text-[9px] text-yellow-500 font-mono font-bold">{card.mana_cost}</span>
            </div>
          )}

          {/* Count Badge in lower corner */}
          {count > 1 && <span className="deck-stack-count-badge">{count}x</span>}

          {/* Banned / Restricted Badge */}
          {isBanned && (
            <div className="deck-stack-status-badge deck-stack-status-badge-banned animate-pulse">
              <FaBan className="text-white text-[8px] shrink-0" />
              <span>{t('banned').toUpperCase()}</span>
            </div>
          )}

          {isRestricted && (
            <div className="deck-stack-status-badge deck-stack-status-badge-restricted">
              <FaExclamationTriangle className="text-white text-[8px] shrink-0" />
              <span>{t('restricted').toUpperCase()}</span>
            </div>
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

  if (isTokenZone) {
    return (
      <div className="deck-stack-container">
        <section className="space-y-3">
          <h4 className="deck-stack-zone-title deck-stack-zone-frontline animate-fadeIn">
            <FaPalette className="shrink-0 text-xs text-indigo-400 animate-pulse" />
            <span>{t('relatedTokens')}</span>
            <span className="deck-stack-zone-count">{allCardsInDeck.length}</span>
          </h4>

          {allCardsInDeck.length === 0 ? (
            <p className="deck-stack-empty-zone">{t('emptyZone')}</p>
          ) : (
            <div className="deck-stack-cards-row">
              {groupCardsByUnique(allCardsInDeck).map((groupedCard) => renderPlaymatCard(groupedCard))}
            </div>
          )}
        </section>

        {selectedModalCard && (
          <CardDetailModal
            card={selectedModalCard}
            imageUrl={getCardImageUrl(selectedModalCard)}
            onAddToDeck={isRemovable ? onAddToDeck : undefined}
            onAddTokenToDeck={onAddTokenToDeck}
            onClose={() => setSelectedModalCard(null)}
            onSelectPrint={handleUpdateCard}
            isToken={true}
            isDeckCard={true}
            deckCards={allCardsInDeck}
            onRemoveFromDeck={onRemoveFromDeck}
            isEditMode={isRemovable}
            deckRelatedTokens={allCardsInDeck.map((c) => ({
              tokenCard: c,
              generatorCardName: ''
            }))}
          />
        )}
      </div>
    );
  }

  return (
    <div className="deck-stack-container">
      {playmatSections.map((section) => {
        const SectionIcon = section.icon;

        return (
          <section key={section.sectionId} className="space-y-3">
            <h4 className={`deck-stack-zone-title ${section.accentClassName}`}>
              <SectionIcon className="shrink-0 text-xs" />
              <span>
                {section.title} ({section.subtitle})
              </span>
              <span className="deck-stack-zone-count">{section.cards.length}</span>
            </h4>

            {section.groupedCards.length === 0 ? (
              <p className="deck-stack-empty-zone">{t('emptyZone')}</p>
            ) : (
              <div className="deck-stack-cards-row">
                {section.groupedCards.map((groupedCard) => renderPlaymatCard(groupedCard))}
              </div>
            )}
          </section>
        );
      })}

      {selectedModalCard && (
        <CardDetailModal
          card={selectedModalCard}
          imageUrl={getCardImageUrl(selectedModalCard)}
          onAddToDeck={isRemovable ? onAddToDeck : undefined}
          onAddTokenToDeck={onAddTokenToDeck}
          onClose={() => setSelectedModalCard(null)}
          onSelectPrint={handleUpdateCard}
          isToken={isTokenZone}
          isDeckCard={true}
          deckCards={allCardsInDeck}
          onRemoveFromDeck={onRemoveFromDeck}
          isEditMode={isRemovable}
        />
      )}
    </div>
  );
}

export default DeckStackView;
