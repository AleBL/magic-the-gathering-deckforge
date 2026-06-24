import { lazy, Suspense, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FaFileAlt,
  FaLayerGroup,
  FaPencilAlt,
  FaBolt,
  FaExclamationTriangle,
  FaChartBar,
  FaSearch,
  FaSlidersH,
  FaList,
  FaTh
} from 'react-icons/fa';
import { Card } from '../types/Card';
import { Deck, DeckFormat, DeckRelatedToken } from '../types/Deck';
import { CardSize } from '../types';
import { groupCards } from '../utils/deckGrouping';
import { validateDeck } from '../utils/deckValidator';
import { ViewMode, NoteTab, useDeckPreviewState } from '../hooks/useDeckPreviewState';
import { DeckFormatType, DeckZone } from '../types/enums';
import { useTokenHandlers } from '../hooks/useTokenHandlers';
import { useDeckStore } from '../store/useDeckStore';
import EmptyState from './ui/EmptyState';
import DeckValidationBadge from './DeckValidationBadge';
import DeckFloatingPreview from './deck/DeckFloatingPreview';
import DeckZoneTabs from './deck/DeckZoneTabs';
import DeckActionBar from './deck/DeckActionBar';
import DeckNotesEditor from './deck/DeckNotesEditor';
import DeckCardList from './deck/DeckCardList';
import DeckStackView from './deck/DeckStackView';
import DeckTokensTab from './deck/DeckTokensTab';
import CardDetailModal from './card/CardDetailModal';

const PlaytestSimulator = lazy(() => import('./PlaytestSimulator'));
const DeckProxyPrint = lazy(() => import('./DeckProxyPrint'));
const DeckStats = lazy(() => import('./DeckStats'));

interface DeckPreviewProps {
  selectedDeck: Deck | null;
  currentDeck: Card[];
  cardSize: CardSize;
  editingDeckId: string | null;
  editingDeckNotes?: string;
  onUpdateNotes?: (notes: string) => void;
  onUpdateCardZone?: (cardId: string, zone: DeckZone) => void;
  onLoadDeckToEdit: (
    id: string,
    name: string,
    format: DeckFormat,
    cards: Card[],
    notes?: string,
    relatedTokens?: DeckRelatedToken[]
  ) => void;
  onDeselectDeck: () => void;
  onAddToDeck: (card: Card) => void;
  onRemoveFromDeck: (card: Card) => void;
  onToggleCommander: (card: Card) => void;
  activeFormat?: DeckFormat;
  showToast: (text: string) => void;
  onCardSizeChange?: (size: CardSize) => void;
  onSaveNotesDirectly?: (deckId: string, notes: string) => void;
  onApplySuggestedLands?: (landCounts: Record<string, number>) => void;
  onUpdateCard?: (updatedCard: Card) => void;
  onSaveTokens?: (deckId: string, tokens: DeckRelatedToken[]) => void;
  deckRelatedTokens?: DeckRelatedToken[];
}

export function DeckPreview({
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
  showToast,
  onCardSizeChange,
  onSaveNotesDirectly,
  onApplySuggestedLands,
  onUpdateCard,
  onSaveTokens,
  deckRelatedTokens
}: DeckPreviewProps) {
  const { t } = useTranslation();

  const {
    viewMode,
    setViewMode,
    hoveredCard,
    mousePos,
    isPlaytestOpen,
    setIsPlaytestOpen,
    isProxyPrintOpen,
    setIsProxyPrintOpen,
    activeNoteTab,
    setActiveNoteTab,
    activeZone,
    setActiveZone,
    selectedTokenForView,
    setSelectedTokenForView,
    groupBy,
    setGroupBy,
    sortBy,
    setSortBy,
    isDisplaySettingsOpen,
    setIsDisplaySettingsOpen,
    activeCards,
    commanders,
    activeTokens,
    groupedCards,
    zoneCounts,
    handleHoverEnter,
    handleHoverMove,
    handleHoverLeave
  } = useDeckPreviewState({ selectedDeck, currentDeck, activeFormat, deckRelatedTokens });

  const { handleDeleteTokenCard, handleAddTokenCardCopy, handleUpdateTokenCard } = useTokenHandlers({
    activeTokens,
    selectedDeckId: selectedDeck?.id,
    editingDeckId,
    onSaveTokens,
    manualAdditionLabel: t('common.manualAddition'),
    setSelectedTokenForView
  });

  const handleTokensLoaded = useCallback(
    (tokens: DeckRelatedToken[]) => {
      if (selectedDeck && onSaveTokens) {
        onSaveTokens(selectedDeck.id, tokens);
      } else if (onSaveTokens) {
        onSaveTokens(editingDeckId || '', tokens);
      }
    },
    [selectedDeck, onSaveTokens, editingDeckId]
  );

  const handleClosePlaytest = useCallback(() => setIsPlaytestOpen(false), [setIsPlaytestOpen]);
  const handleCloseProxyPrint = useCallback(() => setIsProxyPrintOpen(false), [setIsProxyPrintOpen]);
  const handleCloseTokenModal = useCallback(() => setSelectedTokenForView(null), [setSelectedTokenForView]);
  const handleOpenPlaytest = useCallback(() => setIsPlaytestOpen(true), [setIsPlaytestOpen]);
  const handleOpenProxyPrint = useCallback(() => setIsProxyPrintOpen(true), [setIsProxyPrintOpen]);

  const pendingAction = useDeckStore((state) => state.pendingAction);
  const setPendingAction = useDeckStore((state) => state.setPendingAction);

  useEffect(() => {
    if (pendingAction === 'playtest-deck') {
      setIsPlaytestOpen(true);
      setPendingAction(null);
    }
  }, [pendingAction, setIsPlaytestOpen, setPendingAction]);


  const handleLoadSelectedDeckToEdit = useCallback(() => {
    if (selectedDeck) {
      onLoadDeckToEdit(
        selectedDeck.id,
        selectedDeck.name,
        selectedDeck.format || DeckFormatType.FREEFORM,
        selectedDeck.cards,
        selectedDeck.notes,
        selectedDeck.relatedTokens
      );
    }
  }, [selectedDeck, onLoadDeckToEdit]);

  const noteTabHeader = (
    <div className="deck-content-tab-bar">
      <button
        type="button"
        onClick={() => setActiveNoteTab('cards')}
        className={`deck-content-tab ${activeNoteTab === 'cards' ? 'deck-content-tab-active' : ''}`}
      >
        <FaLayerGroup className="text-[11px]" /> {t('deck.currentDeck')}
      </button>
      <button
        type="button"
        onClick={() => setActiveNoteTab('notes')}
        className={`deck-content-tab ${activeNoteTab === 'notes' ? 'deck-content-tab-active' : ''}`}
      >
        <FaPencilAlt className="text-[11px]" /> {t('strategy.strategyGuide')}
      </button>
      <button
        type="button"
        onClick={() => setActiveNoteTab('stats')}
        className={`deck-content-tab ${activeNoteTab === 'stats' ? 'deck-content-tab-active' : ''}`}
      >
        <FaChartBar className="text-[11px]" /> {t('stats.deckStats')}
      </button>
    </div>
  );

  const renderCards = (isRemovable: boolean) => (
    <>
      {/* Display Options & Deck Navigation */}
      <div className="deck-zone-row">
        <DeckZoneTabs
          mainCount={zoneCounts.main}
          sideCount={zoneCounts.sideboard}
          maybeCount={zoneCounts.maybeboard}
          tokensCount={zoneCounts.tokens}
          activeZone={activeZone}
          onZoneChange={setActiveZone}
          onUpdateCardZone={onUpdateCardZone}
        />
      </div>
      {activeZone === 'tokens' ? (
        <DeckTokensTab
          cards={activeCards}
          cachedTokens={deckRelatedTokens || selectedDeck?.relatedTokens}
          onTokensLoaded={handleTokensLoaded}
          onTokenClick={setSelectedTokenForView}
          onlyHeader={true}
          isEditMode={isRemovable}
        />
      ) : null}
      {viewMode === 'stack' ? (
        <DeckStackView
          groups={groupedCards}
          cardSize={cardSize}
          isRemovable={isRemovable}
          activeFormat={selectedDeck ? selectedDeck.format : activeFormat}
          onHoverEnter={handleHoverEnter}
          onHoverMove={handleHoverMove}
          onHoverLeave={handleHoverLeave}
          onRemoveFromDeck={activeZone === 'tokens' ? handleDeleteTokenCard : onRemoveFromDeck}
          onAddToDeck={activeZone === 'tokens' ? handleAddTokenCardCopy : onAddToDeck}
          onAddTokenToDeck={handleAddTokenCardCopy}
          onUpdateCard={onUpdateCard}
          isTokenZone={activeZone === 'tokens'}
          onUpdateCardZone={onUpdateCardZone}
        />
      ) : (
        <DeckCardList
          groups={groupedCards}
          commanders={commanders}
          cardSize={cardSize}
          viewMode={viewMode}
          isRemovable={isRemovable}
          isTokenZone={activeZone === 'tokens'}
          activeFormat={selectedDeck ? selectedDeck.format : activeFormat}
          onUpdateCardZone={onUpdateCardZone}
          onAddToDeck={activeZone === 'tokens' ? handleAddTokenCardCopy : onAddToDeck}
          onAddTokenToDeck={handleAddTokenCardCopy}
          onRemoveFromDeck={activeZone === 'tokens' ? handleDeleteTokenCard : onRemoveFromDeck}
          onToggleCommander={onToggleCommander}
          onHoverEnter={handleHoverEnter}
          onHoverMove={handleHoverMove}
          onHoverLeave={handleHoverLeave}
          onUpdateCard={activeZone === 'tokens' ? handleUpdateTokenCard : onUpdateCard}
        />
      )}
    </>
  );

  const renderDisplayOptionsDropdown = () => (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsDisplaySettingsOpen(!isDisplaySettingsOpen)}
        className={`display-settings-btn ${isDisplaySettingsOpen ? 'display-settings-btn-active' : ''}`}
        title={t('common.displaySettings')}
      >
        <FaSlidersH className="text-xs shrink-0 text-blue-500 dark:text-blue-400" />
        <span>{t('common.viewMode')}</span>
        <span
          className="text-[9px] opacity-60 transition-transform duration-200"
          style={{ transform: isDisplaySettingsOpen ? 'rotate(180deg)' : 'none' }}
        >
          ▼
        </span>
      </button>
      {isDisplaySettingsOpen ? (
        <>
          <div className="fixed inset-0 z-[100]" onClick={() => setIsDisplaySettingsOpen(false)} />
          <div className="display-settings-dropdown">
            <div className="space-y-2">
              <span className="display-settings-section-label">{t('common.viewMode')}</span>
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    { mode: 'list', label: t('common.listView'), icon: FaList },
                    { mode: 'grid', label: t('common.gridView'), icon: FaTh },
                    { mode: 'stack', label: t('strategy.stackView'), icon: FaLayerGroup }
                  ] as const
                ).map(({ mode, label, icon: Icon }) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setViewMode(mode)}
                    className={`option-toggle-btn ${viewMode === mode ? 'option-toggle-btn-active' : ''}`}
                  >
                    <Icon className="text-sm" />
                    <span className="text-[10px] leading-none">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <span className="display-settings-section-label">{t('deck.groupBy')}</span>
              <div className="grid grid-cols-2 gap-1.5">
                {(
                  [
                    { key: 'none', label: t('deck.groupNone') },
                    { key: 'type', label: t('deck.groupType') },
                    { key: 'cmc', label: t('deck.groupCmc') },
                    { key: 'color', label: t('deck.groupColor') }
                  ] as const
                ).map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setGroupBy(key)}
                    className={`option-toggle-btn-compact ${groupBy === key ? 'option-toggle-btn-compact-active' : ''}`}
                    title={label}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <span className="display-settings-section-label">{t('deck.sortBy')}</span>
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    { key: 'name', label: t('deck.sortName') },
                    { key: 'cmc', label: t('deck.sortCmc') },
                    { key: 'rarity', label: t('deck.sortRarity') }
                  ] as const
                ).map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSortBy(key)}
                    className={`option-toggle-btn-compact ${sortBy === key ? 'option-toggle-btn-compact-active' : ''}`}
                    title={label}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {viewMode !== 'list' && onCardSizeChange ? (
              <div className="space-y-2">
                <span className="display-settings-section-label">{t('search.cardSize')}</span>
                <div className="grid grid-cols-4 gap-1.5">
                  {(
                    [
                      { key: 'small', label: t('search.smallInitial') },
                      { key: 'medium', label: t('search.mediumInitial') },
                      { key: 'large', label: t('search.largeInitial') },
                      { key: 'xlarge', label: t('search.xlargeInitial') }
                    ] as const
                  ).map(({ key, label }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => onCardSizeChange(key)}
                      className={`option-toggle-btn-compact ${cardSize === key ? 'option-toggle-btn-compact-active' : ''}`}
                      title={t(`search.${key}`)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );

  if (selectedDeck) {
    const validation = validateDeck(selectedDeck.cards, selectedDeck.format || DeckFormatType.FREEFORM);

    return (
      <div className="deck-preview-section relative">
        <div className="panel-header relative z-50">
          <div>
            <h3 className="text-gray-900 dark:text-white text-xl font-bold transition-colors duration-300 flex items-center gap-2">
              <FaFileAlt className="text-blue-600 shrink-0" />
              {selectedDeck.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-muted">
                {t('validation.format')}:{' '}
                <span className="font-semibold text-gray-800 dark:text-gray-200">
                  {t(selectedDeck.format || DeckFormatType.FREEFORM)}
                </span>
              </span>
              <span className="text-muted">•</span>
              <span className="text-muted">
                {selectedDeck.cards.length} {t('common.cards')}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            {renderDisplayOptionsDropdown()}
            <DeckActionBar
              cards={activeCards}
              selectedDeck={selectedDeck}
              showToast={showToast}
              onPlaytest={handleOpenPlaytest}
              onPrintProxies={handleOpenProxyPrint}
              onLoadDeckToEdit={handleLoadSelectedDeckToEdit}
              onDeselectDeck={onDeselectDeck}
            />
          </div>
        </div>

        <div className="mb-4">
          <DeckValidationBadge validation={validation} formatKey={selectedDeck.format || DeckFormatType.FREEFORM} />
        </div>

        {noteTabHeader}

        {activeNoteTab === 'notes' ? (
          <DeckNotesEditor
            initialNotes={selectedDeck.notes || ''}
            isEditable={true}
            onSave={(notes) => onSaveNotesDirectly?.(selectedDeck.id, notes)}
          />
        ) : activeNoteTab === 'stats' ? (
          <Suspense
            fallback={
              <div className="p-8 text-center text-slate-500 dark:text-slate-400">{t('common.loading')}...</div>
            }
          >
            <DeckStats
              currentDeck={activeCards}
              renderFilteredCards={(filteredCards) => (
                <div className="mt-4">
                  {viewMode === 'stack' ? (
                    <DeckStackView
                      groups={groupCards(filteredCards, groupBy, sortBy)}
                      cardSize={cardSize}
                      isRemovable={false}
                      activeFormat={(selectedDeck?.format || activeFormat) as any}
                      onHoverEnter={handleHoverEnter}
                      onHoverMove={handleHoverMove}
                      onHoverLeave={handleHoverLeave}
                      onRemoveFromDeck={onRemoveFromDeck}
                      onAddToDeck={onAddToDeck}
                      onAddTokenToDeck={handleAddTokenCardCopy}
                      onUpdateCard={onUpdateCard}
                      onUpdateCardZone={onUpdateCardZone}
                    />
                  ) : (
                    <DeckCardList
                      groups={groupCards(filteredCards, groupBy, sortBy)}
                      commanders={commanders.filter((c) => filteredCards.some((f) => f.id === c.id))}
                      cardSize={cardSize}
                      viewMode={viewMode}
                      isRemovable={false}
                      isTokenZone={false}
                      activeFormat={selectedDeck ? selectedDeck.format : activeFormat}
                      onUpdateCardZone={onUpdateCardZone}
                      onAddToDeck={onAddToDeck}
                      onAddTokenToDeck={handleAddTokenCardCopy}
                      onRemoveFromDeck={onRemoveFromDeck}
                      onToggleCommander={onToggleCommander}
                      onHoverEnter={handleHoverEnter}
                      onHoverMove={handleHoverMove}
                      onHoverLeave={handleHoverLeave}
                    />
                  )}
                </div>
              )}
            />
          </Suspense>
        ) : (
          renderCards(false)
        )}

        {viewMode === 'list' && activeNoteTab === 'cards' && hoveredCard ? (
          <DeckFloatingPreview card={hoveredCard} mousePos={mousePos} />
        ) : null}

        <Suspense fallback={null}>
          <PlaytestSimulator
            isOpen={isPlaytestOpen}
            onClose={handleClosePlaytest}
            deckCards={activeCards}
            deckFormat={selectedDeck.format || DeckFormatType.FREEFORM}
            deckRelatedTokens={deckRelatedTokens || selectedDeck?.relatedTokens}
          />
        </Suspense>

        <Suspense fallback={null}>
          <DeckProxyPrint
            isOpen={isProxyPrintOpen}
            onClose={handleCloseProxyPrint}
            cards={activeCards}
            deckName={selectedDeck.name}
            deckRelatedTokens={deckRelatedTokens || selectedDeck?.relatedTokens}
          />
        </Suspense>

        {selectedTokenForView ? (
          <CardDetailModal
            card={selectedTokenForView}
            imageUrl={
              selectedTokenForView.image_uris?.normal || selectedTokenForView.card_faces?.[0]?.image_uris?.normal || ''
            }
            onClose={handleCloseTokenModal}
            isDeckCard={true}
            isToken={true}
            deckCards={activeTokens.map((t) => t.tokenCard)}
            isEditMode={false}
            deckRelatedTokens={activeTokens}
          />
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={`deck-preview-section relative ${editingDeckId ? 'border-l-4 border-amber-400 dark:border-amber-500 pl-3' : ''}`}
    >
      <div className="panel-header relative z-50">
        <div>
          {editingDeckId ? (
            <>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="editing-mode-badge">
                  <FaBolt className="text-[9px] shrink-0" />
                  {t('deck.activeEditingMode')}
                </span>
              </div>
              <h3 className="text-gray-900 dark:text-white text-xl font-bold transition-colors duration-300 text-left truncate">
                {activeCards.length > 0 ? `${activeCards.length} ${t('common.cards')}` : t('deck.addCardsMessage')}
              </h3>
            </>
          ) : (
            <>
              <h3 className="text-gray-900 dark:text-white text-xl font-semibold transition-colors duration-300 text-left">
                {t('deck.currentDeck')}
              </h3>
              {currentDeck.length > 0 ? (
                <span className="unsaved-deck-chip">
                  <FaExclamationTriangle className="text-rose-500 dark:text-rose-400 text-[9px] shrink-0" />
                  <span>{t('deck.temporaryUnsavedDeck')}</span>
                </span>
              ) : null}
            </>
          )}
        </div>
        {currentDeck.length > 0 ? (
          <div className="flex flex-wrap gap-2 items-center">
            {renderDisplayOptionsDropdown()}
            <DeckActionBar
              cards={activeCards}
              showToast={showToast}
              onPlaytest={handleOpenPlaytest}
              onPrintProxies={handleOpenProxyPrint}
            />
          </div>
        ) : null}
      </div>

      {currentDeck.length > 0 ? (
        <div className="mb-4">
          <DeckValidationBadge
            validation={validateDeck(currentDeck, activeFormat || DeckFormatType.FREEFORM)}
            formatKey={activeFormat || DeckFormatType.FREEFORM}
          />
        </div>
      ) : null}

      {noteTabHeader}

      {activeNoteTab === 'notes' ? (
        <DeckNotesEditor initialNotes={editingDeckNotes} isEditable={true} onSave={onUpdateNotes} />
      ) : activeNoteTab === 'stats' ? (
        <Suspense
          fallback={<div className="p-8 text-center text-slate-500 dark:text-slate-400">{t('common.loading')}...</div>}
        >
          <DeckStats
            currentDeck={activeCards}
            onApplySuggestedLands={onApplySuggestedLands}
            renderFilteredCards={(filteredCards) => (
              <div className="mt-4">
                {viewMode === 'stack' ? (
                  <DeckStackView
                    groups={groupCards(filteredCards, groupBy, sortBy)}
                    cardSize={cardSize}
                    isRemovable={false}
                    activeFormat={activeFormat}
                    onHoverEnter={handleHoverEnter}
                    onHoverMove={handleHoverMove}
                    onHoverLeave={handleHoverLeave}
                    onRemoveFromDeck={onRemoveFromDeck}
                    onAddToDeck={onAddToDeck}
                    onAddTokenToDeck={handleAddTokenCardCopy}
                    onUpdateCard={onUpdateCard}
                    onUpdateCardZone={onUpdateCardZone}
                  />
                ) : (
                  <DeckCardList
                    groups={groupCards(filteredCards, groupBy, sortBy)}
                    commanders={commanders.filter((c) => filteredCards.some((f) => f.id === c.id))}
                    cardSize={cardSize}
                    viewMode={viewMode}
                    isRemovable={false}
                    isTokenZone={false}
                    activeFormat={activeFormat}
                    onUpdateCardZone={onUpdateCardZone}
                    onAddToDeck={onAddToDeck}
                    onAddTokenToDeck={handleAddTokenCardCopy}
                    onRemoveFromDeck={onRemoveFromDeck}
                    onToggleCommander={onToggleCommander}
                    onHoverEnter={handleHoverEnter}
                    onHoverMove={handleHoverMove}
                    onHoverLeave={handleHoverLeave}
                  />
                )}
              </div>
            )}
          />
        </Suspense>
      ) : (
        <>
          {currentDeck.length === 0 ? (
            <EmptyState
              icon={<FaLayerGroup />}
              title={t('deck.emptyDeck')}
              description={t('deck.addCardsMessage')}
              action={{
                label: t('search.searchForCards'),
                onClick: () => {
                  const setPendingAction = useDeckStore.getState().setPendingAction;
                  setPendingAction('focus-search');
                  document.getElementById('nav-search-btn')?.click(); // Fallback for changing tab, as activeTab is in App state
                }
              }}
            />
          ) : (
            renderCards(true)
          )}
        </>
      )}

      {viewMode === 'list' && activeNoteTab === 'cards' && hoveredCard ? (
        <DeckFloatingPreview card={hoveredCard} mousePos={mousePos} />
      ) : null}

      <Suspense fallback={null}>
        <PlaytestSimulator
          isOpen={isPlaytestOpen}
          onClose={handleClosePlaytest}
          deckCards={activeCards}
          deckFormat={activeFormat}
          deckRelatedTokens={deckRelatedTokens}
        />
      </Suspense>

      <Suspense fallback={null}>
        <DeckProxyPrint
          isOpen={isProxyPrintOpen}
          onClose={handleCloseProxyPrint}
          cards={activeCards}
          deckRelatedTokens={deckRelatedTokens}
        />
      </Suspense>

      {selectedTokenForView ? (
        <CardDetailModal
          card={selectedTokenForView}
          imageUrl={
            selectedTokenForView.image_uris?.normal || selectedTokenForView.card_faces?.[0]?.image_uris?.normal || ''
          }
          onClose={handleCloseTokenModal}
          isDeckCard={true}
          isToken={true}
          deckCards={activeTokens.map((t) => t.tokenCard)}
          onSelectPrint={handleUpdateTokenCard}
          onRemoveFromDeck={handleDeleteTokenCard}
          onAddToDeck={handleAddTokenCardCopy}
          onAddTokenToDeck={handleAddTokenCardCopy}
          isEditMode={true}
          deckRelatedTokens={activeTokens}
        />
      ) : null}
    </div>
  );
}

export default DeckPreview;
