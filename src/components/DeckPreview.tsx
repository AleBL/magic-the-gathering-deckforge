import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FaFileAlt, FaLayerGroup, FaPencilAlt, FaBolt, FaExclamationTriangle, FaChartBar } from 'react-icons/fa';
import { Card } from '../types/Card';
import { Deck, DeckFormat } from '../types/Deck';
import { CardSize } from '../types';
import { groupCards, getCardImageUrl } from '../utils/deckGrouping';
import { validateDeck } from '../utils/deckValidator';
import DeckValidationBadge from './DeckValidationBadge';
import PlaytestSimulator from './PlaytestSimulator';
import DeckFloatingPreview from './deck/DeckFloatingPreview';
import DeckZoneTabs from './deck/DeckZoneTabs';
import DeckViewToggle from './deck/DeckViewToggle';
import DeckActionBar from './deck/DeckActionBar';
import DeckNotesEditor from './deck/DeckNotesEditor';
import DeckCardList from './deck/DeckCardList';
import DeckStackView from './deck/DeckStackView';
import CardSizeSelector from './CardSizeSelector';
import DeckProxyPrint from './DeckProxyPrint';
import DeckStats from './DeckStats';

interface DeckPreviewProps {
  selectedDeck: Deck | null;
  currentDeck: Card[];
  cardSize: CardSize;
  editingDeckId: string | null;
  editingDeckNotes?: string;
  onUpdateNotes?: (notes: string) => void;
  onUpdateCardZone?: (cardId: string, zone: 'main' | 'sideboard' | 'maybeboard') => void;
  onLoadDeckToEdit: (id: string, name: string, format: DeckFormat, cards: Card[], notes?: string) => void;
  onDeselectDeck: () => void;
  onAddToDeck: (card: Card) => void;
  onRemoveFromDeck: (card: Card) => void;
  onToggleCommander: (card: Card) => void;
  activeFormat?: DeckFormat;
  groupBy: 'none' | 'type' | 'cmc' | 'color';
  sortBy: 'name' | 'cmc' | 'rarity';
  showToast: (text: string) => void;
  onCardSizeChange?: (size: CardSize) => void;
  onSaveNotesDirectly?: (deckId: string, notes: string) => void;
  onApplySuggestedLands?: (landCounts: Record<string, number>) => void;
}

type ViewMode = 'list' | 'grid' | 'stack';
type NoteTab = 'cards' | 'notes' | 'stats';
type Zone = 'main' | 'sideboard' | 'maybeboard';

function DeckPreview({
  selectedDeck,
  currentDeck,
  cardSize,
  editingDeckId,
  editingDeckNotes = '',
  onUpdateNotes,
  onUpdateCardZone,
  onLoadDeckToEdit,
  onDeselectDeck,
  onAddToDeck,
  onRemoveFromDeck,
  onToggleCommander,
  activeFormat,
  groupBy,
  sortBy,
  showToast,
  onCardSizeChange,
  onSaveNotesDirectly,
  onApplySuggestedLands
}: DeckPreviewProps) {
  const { t } = useTranslation();

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [hoveredCard, setHoveredCard] = useState<Card | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPlaytestOpen, setIsPlaytestOpen] = useState(false);
  const [isProxyPrintOpen, setIsProxyPrintOpen] = useState(false);
  const [activeNoteTab, setActiveNoteTab] = useState<NoteTab>('cards');
  const [activeZone, setActiveZone] = useState<Zone>('main');

  const activeCards = useMemo(() => (selectedDeck ? selectedDeck.cards : currentDeck), [selectedDeck, currentDeck]);

  // Preload card images into browser cache to avoid flickers on hover enter
  useEffect(() => {
    if (!activeCards || activeCards.length === 0) return;
    const preloadImages = () => {
      const uniqueUrls = new Set<string>();
      activeCards.forEach((c) => {
        const url = getCardImageUrl(c);
        if (url) uniqueUrls.add(url);
      });
      uniqueUrls.forEach((url) => {
        const img = new Image();
        img.src = url;
      });
    };
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(preloadImages);
    } else {
      setTimeout(preloadImages, 100);
    }
  }, [activeCards]);

  const isCommanderFormat = useMemo(() => {
    const fmt = selectedDeck ? selectedDeck.format : activeFormat;
    return fmt === 'commander';
  }, [selectedDeck, activeFormat]);

  const commanders = useMemo(
    () => (isCommanderFormat ? activeCards.filter((c) => c.isCommander) : []),
    [activeCards, isCommanderFormat]
  );

  const zoneCards = useMemo(
    () => activeCards.filter((c) => (c.zone || 'main') === activeZone),
    [activeCards, activeZone]
  );

  const deckCards = useMemo(
    () => (isCommanderFormat ? zoneCards.filter((c) => !c.isCommander) : zoneCards),
    [zoneCards, isCommanderFormat]
  );

  const groupedCards = useMemo(() => groupCards(deckCards, groupBy, sortBy), [deckCards, groupBy, sortBy]);

  const zoneCounts = useMemo(
    () => ({
      main: activeCards.filter((c) => !c.zone || c.zone === 'main').length,
      sideboard: activeCards.filter((c) => c.zone === 'sideboard').length,
      maybeboard: activeCards.filter((c) => c.zone === 'maybeboard').length
    }),
    [activeCards]
  );

  const handleHoverEnter = (card: Card, e: React.MouseEvent) => {
    setHoveredCard(card);
    setMousePos({ x: e.clientX, y: e.clientY });
  };
  const handleHoverMove = (e: React.MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY });
  const handleHoverLeave = () => setHoveredCard(null);

  const noteTabHeader = (
    <div className="flex border-b border-gray-250 dark:border-gray-700 mb-4 text-xs font-bold gap-3 select-none">
      <button
        type="button"
        onClick={() => setActiveNoteTab('cards')}
        className={`pb-2 transition-all border-b-2 flex items-center gap-1.5 ${activeNoteTab === 'cards' ? 'border-blue-500 text-blue-600 dark:text-blue-400 font-extrabold' : 'border-transparent text-gray-400 hover:text-gray-500'}`}
      >
        <FaLayerGroup className="text-[11px]" /> {t('currentDeck')}
      </button>
      <button
        type="button"
        onClick={() => setActiveNoteTab('notes')}
        className={`pb-2 transition-all border-b-2 flex items-center gap-1.5 ${activeNoteTab === 'notes' ? 'border-blue-500 text-blue-600 dark:text-blue-400 font-extrabold' : 'border-transparent text-gray-400 hover:text-gray-500'}`}
      >
        <FaPencilAlt className="text-[11px]" /> {t('strategyGuide')}
      </button>
      <button
        type="button"
        onClick={() => setActiveNoteTab('stats')}
        className={`pb-2 transition-all border-b-2 flex items-center gap-1.5 ${activeNoteTab === 'stats' ? 'border-blue-500 text-blue-600 dark:text-blue-400 font-extrabold' : 'border-transparent text-gray-400 hover:text-gray-500'}`}
      >
        <FaChartBar className="text-[11px]" /> {t('deckStats')}
      </button>
    </div>
  );

  const renderCards = (isRemovable: boolean) => (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <DeckZoneTabs
          mainCount={zoneCounts.main}
          sideCount={zoneCounts.sideboard}
          maybeCount={zoneCounts.maybeboard}
          activeZone={activeZone}
          onZoneChange={setActiveZone}
        />
        {(viewMode === 'grid' || viewMode === 'stack') && onCardSizeChange && (
          <div className="scale-90 origin-right shrink-0">
            <CardSizeSelector selectedSize={cardSize} onSizeChange={onCardSizeChange} />
          </div>
        )}
      </div>
      {viewMode === 'stack' ? (
        <DeckStackView
          groups={groupedCards}
          cardSize={cardSize}
          isRemovable={isRemovable}
          activeFormat={selectedDeck ? selectedDeck.format : activeFormat}
          onHoverEnter={handleHoverEnter}
          onHoverMove={handleHoverMove}
          onHoverLeave={handleHoverLeave}
          onRemoveFromDeck={onRemoveFromDeck}
          onAddToDeck={onAddToDeck}
        />
      ) : (
        <DeckCardList
          groups={groupedCards}
          commanders={commanders}
          cardSize={cardSize}
          viewMode={viewMode}
          isRemovable={isRemovable}
          activeFormat={selectedDeck ? selectedDeck.format : activeFormat}
          onUpdateCardZone={onUpdateCardZone}
          onAddToDeck={onAddToDeck}
          onRemoveFromDeck={onRemoveFromDeck}
          onToggleCommander={onToggleCommander}
          onHoverEnter={handleHoverEnter}
          onHoverMove={handleHoverMove}
          onHoverLeave={handleHoverLeave}
        />
      )}
    </>
  );

  // ─── Selected Deck (View Mode) ────────────────────────────────────
  if (selectedDeck) {
    const validation = validateDeck(selectedDeck.cards, selectedDeck.format || 'freeform');

    return (
      <div className="deck-preview-section relative">
        <div className="panel-header">
          <div>
            <h3 className="text-gray-900 dark:text-white text-xl font-bold transition-colors duration-300 flex items-center gap-2">
              <FaFileAlt className="text-blue-600 shrink-0" />
              {selectedDeck.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-muted">
                {t('format')}:{' '}
                <span className="font-semibold text-gray-800 dark:text-gray-200">
                  {t(selectedDeck.format || 'freeform')}
                </span>
              </span>
              <span className="text-muted">•</span>
              <span className="text-muted">
                {selectedDeck.cards.length} {t('cards')}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <DeckViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
            <DeckActionBar
              cards={activeCards}
              selectedDeck={selectedDeck}
              showToast={showToast}
              onPlaytest={() => setIsPlaytestOpen(true)}
              onPrintProxies={() => setIsProxyPrintOpen(true)}
              onLoadDeckToEdit={() =>
                onLoadDeckToEdit(
                  selectedDeck.id,
                  selectedDeck.name,
                  selectedDeck.format || 'freeform',
                  selectedDeck.cards,
                  selectedDeck.notes
                )
              }
              onDeselectDeck={onDeselectDeck}
            />
          </div>
        </div>

        <div className="mb-4">
          <DeckValidationBadge validation={validation} formatKey={selectedDeck.format || 'freeform'} />
        </div>

        {noteTabHeader}

        {activeNoteTab === 'notes' ? (
          <DeckNotesEditor
            initialNotes={selectedDeck.notes || ''}
            isEditable={true}
            onSave={(notes) => onSaveNotesDirectly?.(selectedDeck.id, notes)}
          />
        ) : activeNoteTab === 'stats' ? (
          <DeckStats currentDeck={activeCards} />
        ) : (
          renderCards(false)
        )}

        {viewMode === 'list' && activeNoteTab === 'cards' && hoveredCard && (
          <DeckFloatingPreview card={hoveredCard} mousePos={mousePos} />
        )}

        <PlaytestSimulator
          isOpen={isPlaytestOpen}
          onClose={() => setIsPlaytestOpen(false)}
          deckCards={activeCards}
          deckFormat={selectedDeck.format || 'freeform'}
        />

        <DeckProxyPrint
          isOpen={isProxyPrintOpen}
          onClose={() => setIsProxyPrintOpen(false)}
          cards={activeCards}
          deckName={selectedDeck.name}
        />
      </div>
    );
  }

  // ─── Deck in Edit / Construction Mode ────────────────────────────────────────
  return (
    <div className="deck-preview-section relative">
      <div className="panel-header">
        <div>
          <h3 className="text-gray-900 dark:text-white text-xl font-semibold transition-colors duration-300 text-left">
            {t('currentDeck')} {editingDeckId && `(${t('editingDeck')})`}
          </h3>
          {editingDeckId ? (
            <span className="active-edit-badge mt-1 inline-flex items-center gap-1.5">
              <FaBolt className="text-amber-400 animate-pulse text-[10px]" />
              <span>{t('activeEditingMode')}</span>
            </span>
          ) : currentDeck.length > 0 ? (
            <span className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25 px-2.5 py-0.5 rounded-full text-[10px] font-bold mt-1.5 inline-flex items-center gap-1 shadow-sm">
              <FaExclamationTriangle className="text-rose-500 dark:text-rose-400 text-[9px] shrink-0" />
              <span>{t('temporaryUnsavedDeck')}</span>
            </span>
          ) : null}
        </div>
        {currentDeck.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <DeckViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
            <DeckActionBar
              cards={activeCards}
              showToast={showToast}
              onPlaytest={() => setIsPlaytestOpen(true)}
              onPrintProxies={() => setIsProxyPrintOpen(true)}
            />
          </div>
        )}
      </div>

      {noteTabHeader}

      {activeNoteTab === 'notes' ? (
        <DeckNotesEditor initialNotes={editingDeckNotes} isEditable={true} onSave={onUpdateNotes} />
      ) : activeNoteTab === 'stats' ? (
        <DeckStats currentDeck={activeCards} onApplySuggestedLands={onApplySuggestedLands} />
      ) : (
        <>
          {currentDeck.length === 0 ? (
            <p className="text-muted text-left">{t('addCardsMessage')}</p>
          ) : (
            renderCards(true)
          )}
        </>
      )}

      {viewMode === 'list' && activeNoteTab === 'cards' && hoveredCard && (
        <DeckFloatingPreview card={hoveredCard} mousePos={mousePos} />
      )}

      <PlaytestSimulator
        isOpen={isPlaytestOpen}
        onClose={() => setIsPlaytestOpen(false)}
        deckCards={activeCards}
        deckFormat={activeFormat}
      />

      <DeckProxyPrint
        isOpen={isProxyPrintOpen}
        onClose={() => setIsProxyPrintOpen(false)}
        cards={activeCards}
      />
    </div>
  );
}

export default DeckPreview;
