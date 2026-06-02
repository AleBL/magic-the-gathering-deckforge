import { useState, ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FaSave,
  FaPlus,
  FaTrash,
  FaFileImport,
  FaFileExport,
  FaTimes,
  FaLightbulb,
  FaBook,
  FaSortAmountDown,
  FaChartBar,
  FaExclamationTriangle
} from 'react-icons/fa';
import { Card } from '../types/Card';
import { DeckFormat } from '../types/Deck';
import { CardSize } from '../types';
import CardSizeSelector from './CardSizeSelector';
import DeckList from './DeckList';
import DeckPreview from './DeckPreview';
import DeckSaveDialog from './DeckSaveDialog';
import DeckValidationBadge from './DeckValidationBadge';
import DeckStats from './DeckStats';
import CustomDialog from './CustomDialog';
import useDeckManager from '../hooks/useDeckManager';

interface DeckManagerProps {
  currentDeck: Card[];
  onAddToDeck: (card: Card) => void;
  onRemoveFromDeck: (card: Card) => void;
  onToggleCommander: (card: Card) => void;
  onClearDeck: () => void;
  editingDeckId: string | null;
  editingDeckName: string;
  editingDeckFormat: DeckFormat;
  editingDeckNotes?: string;
  onUpdateNotes?: (notes: string) => void;
  onUpdateCardZone?: (cardId: string, zone: 'main' | 'sideboard' | 'maybeboard') => void;
  onLoadDeckToEdit: (id: string, name: string, format: DeckFormat, cards: Card[], notes?: string) => void;
  onCancelEdit: () => void;
  showToast: (text: string) => void;
  onUpdateCard?: (updatedCard: Card) => void;
}

function DeckManager({
  currentDeck,
  onAddToDeck,
  onRemoveFromDeck,
  onToggleCommander,
  onClearDeck,
  editingDeckId,
  editingDeckName,
  editingDeckFormat,
  editingDeckNotes = '',
  onUpdateNotes,
  onUpdateCardZone,
  onLoadDeckToEdit,
  onCancelEdit,
  showToast,
  onUpdateCard
}: DeckManagerProps) {
  const { t, i18n } = useTranslation();
  const [cardSize, setCardSize] = useState<CardSize>('small');
  const [sortBy, setSortBy] = useState<'name' | 'cmc' | 'rarity'>('name');
  const [groupBy, setGroupBy] = useState<'none' | 'type' | 'cmc' | 'color'>('none');

  const [isTextImportOpen, setIsTextImportOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [textDeckList, setTextDeckList] = useState('');

  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    type: 'alert' | 'confirm';
    title: string;
    message: string;
    onConfirm: () => void;
    variant: 'danger' | 'warning' | 'info' | 'success';
  }>({
    isOpen: false,
    type: 'alert',
    title: '',
    message: '',
    onConfirm: () => {},
    variant: 'info'
  });

  const {
    savedDecks,
    deckName,
    setDeckName,
    deckFormat,
    setDeckFormat,
    showSaveDialog,
    setShowSaveDialog,
    selectedDeck,
    setSelectedDeck,
    deckValidation,
    saveDeck,
    saveEditedDeck,
    deleteDeck,
    exportDeck,
    exportAllDecks,
    importDeckFile,
    saveTokensToDeck
  } = useDeckManager(currentDeck, editingDeckId, editingDeckFormat, onCancelEdit);

  const activeFormat = editingDeckId ? editingDeckFormat : deckFormat;
  const activeStatsDeck = selectedDeck ? selectedDeck.cards : currentDeck;

  const showAlert = (title: string, message: string, variant: 'danger' | 'warning' | 'info' | 'success' = 'info') => {
    setDialogState({
      isOpen: true,
      type: 'alert',
      title,
      message,
      onConfirm: () => setDialogState((prev) => ({ ...prev, isOpen: false })),
      variant
    });
  };

  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    variant: 'danger' | 'warning' | 'info' | 'success' = 'warning'
  ) => {
    setDialogState({
      isOpen: true,
      type: 'confirm',
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setDialogState((prev) => ({ ...prev, isOpen: false }));
      },
      variant
    });
  };

  const handleSaveDeck = () => {
    const result = saveDeck(deckName, deckFormat, currentDeck, editingDeckNotes);
    if (result.success && result.createdDeck) {
      showAlert(t('successTitle'), t('deckSaved'), 'success');
      onLoadDeckToEdit(
        result.createdDeck.id,
        result.createdDeck.name,
        result.createdDeck.format,
        result.createdDeck.cards,
        result.createdDeck.notes
      );
    } else if (result.errorKey) {
      showAlert(t('errorTitle'), t(result.errorKey), 'danger');
    }
  };

  const handleSaveEditedDeck = () => {
    if (!editingDeckId) return;
    const result = saveEditedDeck(editingDeckId, editingDeckName, editingDeckFormat, currentDeck, editingDeckNotes);
    if (result.success) {
      showAlert(t('successTitle'), t('deckSaved'), 'success');
    }
  };

  const handleDeleteDeck = (deckId: string) => {
    showConfirm(t('confirmDeleteTitle'), t('confirmDelete'), () => deleteDeck(deckId), 'danger');
  };

  const handleSaveDeckNotesDirectly = (deckId: string, notes: string) => {
    const deckToUpdate = savedDecks.find((deck) => deck.id === deckId);
    if (!deckToUpdate) return;

    saveEditedDeck(deckToUpdate.id, deckToUpdate.name, deckToUpdate.format, deckToUpdate.cards, notes);
    setSelectedDeck((previousSelectedDeck) =>
      previousSelectedDeck && previousSelectedDeck.id === deckId
        ? { ...previousSelectedDeck, notes }
        : previousSelectedDeck
    );
    showToast(t('deckSaved'));
  };

  const handleImportDeck = async (event: ChangeEvent<HTMLInputElement>) => {
    const { target } = event;
    const file = target.files?.[0];
    if (!file) return;

    const result = await importDeckFile(file);
    if (result.success) {
      showAlert(t('successTitle'), t('deckImported'), 'success');
    } else if (result.errorKey) {
      showAlert(t('errorTitle'), t(result.errorKey), 'danger');
    }
    target.value = '';
  };

  const parseDeckText = (text: string): { name: string; quantity: number }[] => {
    const lines = text.split('\n');
    const parsedCards: { name: string; quantity: number }[] = [];

    for (let line of lines) {
      line = line.trim();
      if (!line) continue;

      const match = line.match(/^(\d+)[xX]?\s+(.+)$/) || line.match(/^([xX]\d+)\s+(.+)$/);
      let qty = 1;
      let cardName = line;

      if (match) {
        qty = parseInt(match[1].replace(/[xX]/g, ''), 10) || 1;
        cardName = match[2].trim();
      }

      // Remove collector number / set code, e.g. "(M10) 1" or "[M10] 1" or "M10 1" at the end of the card name
      cardName = cardName.replace(/\s*[([][A-Za-z0-9]{3,4}[)\]]\s*\d*$/, '').trim();
      cardName = cardName.replace(/\s+[A-Za-z0-9]{3,4}\s+\d+$/, '').trim();

      if (cardName) {
        parsedCards.push({ name: cardName, quantity: qty });
      }
    }
    return parsedCards;
  };

  const importTextDeck = async (text: string) => {
    const parsed = parseDeckText(text);
    if (parsed.length === 0) return;

    setIsImporting(true);
    setErrorMsg(null);

    try {
      const uniqueNames = Array.from(new Set(parsed.map((parsedCard) => parsedCard.name)));
      const allResolvedCards: Card[] = [];

      const CHUNK_SIZE = 75;
      for (let chunkStartIndex = 0; chunkStartIndex < uniqueNames.length; chunkStartIndex += CHUNK_SIZE) {
        const chunk = uniqueNames.slice(chunkStartIndex, chunkStartIndex + CHUNK_SIZE);
        const body = {
          identifiers: chunk.map((name) => ({ name }))
        };

        const response = await fetch('https://api.scryfall.com/cards/collection', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        });

        if (!response.ok) {
          throw new Error('Scryfall API error');
        }

        const json = await response.json();
        if (json.data && Array.isArray(json.data)) {
          allResolvedCards.push(...json.data);
        }
      }

      if (allResolvedCards.length === 0) {
        throw new Error('No cards found');
      }

      // Translate to the current language if it is not English
      let translatedCardsList = allResolvedCards;
      const currentLang = i18n.language || 'en';
      if (currentLang !== 'en') {
        const { translateCards } = await import('../utils/translationHelper');
        translatedCardsList = await translateCards(allResolvedCards, currentLang);
      }

      const cardLookup = new Map<string, Card>();
      translatedCardsList.forEach((card) => {
        if (card.name) cardLookup.set(card.name.toLowerCase(), card);
        if (card.printed_name) cardLookup.set(card.printed_name.toLowerCase(), card);
      });

      const finalCards: Card[] = [];
      const unfoundNames: string[] = [];

      parsed.forEach((item) => {
        const normalizedName = item.name.toLowerCase();
        const foundCard = cardLookup.get(normalizedName);
        if (foundCard) {
          for (let copyIndex = 0; copyIndex < item.quantity; copyIndex++) {
            finalCards.push(foundCard);
          }
        } else {
          unfoundNames.push(item.name);
        }
      });

      if (finalCards.length > 0) {
        const deckIdToLoad = editingDeckId || '';
        const deckNameToLoad = editingDeckName || t('importedDeckName');
        const deckFormatToLoad = editingDeckFormat || 'freeform';

        onLoadDeckToEdit(deckIdToLoad, deckNameToLoad, deckFormatToLoad, finalCards);
        showToast(t('deckImported'));
        setIsTextImportOpen(false);

        if (unfoundNames.length > 0) {
          showAlert(
            t('warningTitle'),
            `${t('importError')}\n${t('unresolvedCards')}: ${unfoundNames.join(', ')}`,
            'warning'
          );
        }
      } else {
        setErrorMsg(t('importError'));
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      setErrorMsg(t('importError'));
    } finally {
      setIsImporting(false);
    }
  };

  const handleApplySuggestedLands = (landCounts: Record<string, number>) => {
    const basicLandsList = [
      'Plains',
      'Island',
      'Swamp',
      'Mountain',
      'Forest',
      'Wastes',
      'Planície',
      'Ilha',
      'Pântano',
      'Montanha',
      'Floresta',
      'Deserto'
    ];

    const nonBasicLands = currentDeck.filter((card) => {
      const isBasic = card.type_line?.toLowerCase().includes('basic land') || basicLandsList.includes(card.name);
      return !isBasic;
    });

    const createBasicLandCard = (name: string): Card => {
      const ids: Record<string, string> = {
        Plains: 'plains-basic-land',
        Island: 'island-basic-land',
        Swamp: 'swamp-basic-land',
        Mountain: 'mountain-basic-land',
        Forest: 'forest-basic-land',
        Wastes: 'wastes-basic-land'
      };

      const colorsMap: Record<string, string[]> = {
        Plains: ['W'],
        Island: ['U'],
        Swamp: ['B'],
        Mountain: ['R'],
        Forest: ['G'],
        Wastes: []
      };

      const imagesMap: Record<string, string> = {
        Plains: 'https://cards.scryfall.io/normal/front/a/e/ae53a152-4043-424d-9050-8b186f982829.jpg',
        Island: 'https://cards.scryfall.io/normal/front/1/c/1c84cb13-43ef-4d37-84ec-86cffcd14984.jpg',
        Swamp: 'https://cards.scryfall.io/normal/front/2/a/2ae68e9f-7df8-43d9-a78b-49ef4599c9c8.jpg',
        Mountain: 'https://cards.scryfall.io/normal/front/0/e/0efad862-2ee7-4a0b-93ff-1830491fb342.jpg',
        Forest: 'https://cards.scryfall.io/normal/front/5/4/5446059d-47fe-493e-8120-cfbc11d29377.jpg',
        Wastes: 'https://cards.scryfall.io/normal/front/0/3/036c84c1-6b45-4424-aa61-5991d7c35fa9.jpg'
      };

      return {
        id: ids[name] || `basic-land-${name.toLowerCase()}`,
        oracle_id: `basic-land-oracle-${name.toLowerCase()}`,
        name: name,
        printed_name: name,
        type_line: 'Basic Land',
        printed_type_line: 'Terreno Básico',
        mana_cost: '',
        cmc: 0,
        rarity: 'common',
        set_name: 'Standard Basic Lands',
        colors: colorsMap[name] || [],
        color_identity: colorsMap[name] || [],
        image_uris: {
          small: imagesMap[name] || '',
          normal: imagesMap[name] || '',
          large: imagesMap[name] || '',
          png: imagesMap[name] || ''
        }
      };
    };

    const newBasicLands: Card[] = [];
    Object.entries(landCounts).forEach(([landName, count]) => {
      for (let landCopyIndex = 0; landCopyIndex < count; landCopyIndex++) {
        newBasicLands.push(createBasicLandCard(landName));
      }
    });

    const newDeckCards = [...nonBasicLands, ...newBasicLands];
    // Preserve the current editing state — never use '' as deckId if we're genuinely editing
    onLoadDeckToEdit(editingDeckId ?? '', editingDeckName || '', activeFormat, newDeckCards, editingDeckNotes);
    showToast(t('deckSaved'));
  };

  return (
    <div className="workspace-container">
      <div className="workspace-header">
        {/* Header */}
        <div className="manager-title-row">
          <h2 className="text-gray-900 dark:text-white text-2xl font-bold transition-colors duration-300 flex items-center gap-2">
            <FaBook className="text-blue-600 text-xl" />
            {t('deckManager')}
            <div className="relative group/tooltip inline-flex items-center ml-1">
              <button
                type="button"
                className="text-gray-400 hover:text-yellow-500 transition-colors p-1 focus:outline-none"
                aria-label="Info"
              >
                <FaLightbulb className="text-yellow-500 text-base" />
              </button>
              <div className="absolute left-1/2 md:left-0 top-full mt-2 w-72 p-3 bg-slate-900 dark:bg-slate-950 text-white text-xs rounded-lg shadow-xl border border-slate-700 dark:border-slate-800 opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-all duration-300 z-50 transform translate-y-1 group-hover/tooltip:translate-y-0 -translate-x-1/2 md:translate-x-0">
                <p className="font-medium leading-relaxed">{t('savedLocationNote')}</p>
              </div>
            </div>
          </h2>
        </div>

        {/* Toolbar */}
        <div className="manager-toolbar">
          {/* Deck Operations Group */}
          <div className="toolbar-group">
            {editingDeckId ? (
              <div className="toolbar-group-responsive">
                <button type="button" onClick={handleSaveEditedDeck} className="primary-button text-xs py-1.5 px-3">
                  <FaSave className="text-xs shrink-0" />
                  {t('saveChanges')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDeckName(`${editingDeckName} (Cópia)`);
                    setDeckFormat(editingDeckFormat);
                    setShowSaveDialog(true);
                  }}
                  className="success-button text-xs py-1.5 px-3"
                >
                  <FaPlus className="text-xs shrink-0" />
                  {t('saveAsNew')}
                </button>
                <button type="button" onClick={onCancelEdit} className="danger-button text-xs py-1.5 px-3">
                  <FaTimes className="text-xs shrink-0" />
                  {t('cancel')}
                </button>
              </div>
            ) : (
              <button
                id="save-deck-btn"
                type="button"
                onClick={() => {
                  setDeckName('');
                  setShowSaveDialog(true);
                }}
                disabled={currentDeck.length === 0}
                className="success-button text-xs py-1.5 px-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaSave className="text-xs shrink-0" />
                {t('saveCurrentDeck')} ({currentDeck.length} {t('cards')})
              </button>
            )}

            <button
              id="clear-deck-btn"
              type="button"
              onClick={onClearDeck}
              disabled={currentDeck.length === 0}
              className="danger-button text-xs py-1.5 px-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaTrash className="text-xs shrink-0" />
              {t('clearCurrentDeck')}
            </button>
          </div>

          {/* Import/Export Data Group */}
          <div className="toolbar-actions">
            <button
              type="button"
              onClick={() => {
                setTextDeckList('');
                setErrorMsg(null);
                setIsTextImportOpen(true);
              }}
              className="secondary-button text-xs py-1.5 px-3 flex items-center gap-1"
            >
              <FaFileImport className="text-xs shrink-0" />
              {t('importTextList')}
            </button>

            <label
              htmlFor="deck-import-file-input"
              className="secondary-button text-xs py-1.5 px-3 cursor-pointer flex items-center gap-1"
            >
              <FaFileImport className="text-xs shrink-0" />
              {t('importDeck')}
              <input
                id="deck-import-file-input"
                type="file"
                accept=".json"
                onChange={handleImportDeck}
                className="hidden"
              />
            </label>

            {savedDecks.length > 0 && (
              <button type="button" onClick={exportAllDecks} className="secondary-button text-xs py-1.5 px-3">
                <FaFileExport className="text-xs shrink-0" />
                {t('exportAllDecks')}
              </button>
            )}
          </div>
        </div>

        {/* Grouping and Sorting subheader controls */}
        <div className="manager-subheader-toolbar">
          <div className="subheader-group">
            <div className="subheader-item">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <FaSortAmountDown className="text-gray-400 animate-pulse" />
                {t('groupBy')}:
              </span>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as 'none' | 'type' | 'cmc' | 'color')}
                className="form-select text-xs bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md py-1 px-2 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="none">{t('groupNone')}</option>
                <option value="type">{t('groupType')}</option>
                <option value="cmc">{t('groupCmc')}</option>
                <option value="color">{t('groupColor')}</option>
              </select>
            </div>
            <div className="subheader-item">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('sortBy')}:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'cmc' | 'rarity')}
                className="form-select text-xs bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md py-1 px-2 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="name">{t('sortName')}</option>
                <option value="cmc">{t('sortCmc')}</option>
                <option value="rarity">{t('sortRarity')}</option>
              </select>
            </div>
          </div>

          {currentDeck.length > 0 && (
            <div className="subheader-actions">
              <CardSizeSelector selectedSize={cardSize} onSizeChange={setCardSize} />
              <div className="shrink-0">
                <DeckValidationBadge validation={deckValidation} formatKey={activeFormat} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main content: deck list + preview */}
      <div className="workspace-body">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
          <DeckList
            decks={savedDecks}
            selectedDeckId={selectedDeck?.id ?? null}
            editingDeckId={editingDeckId}
            onSelectDeck={setSelectedDeck}
            onEditDeck={(id: string, name: string, format: DeckFormat, cards: Card[], notes?: string) => {
              setSelectedDeck(null);
              onLoadDeckToEdit(id, name, format, cards, notes);
            }}
            onExportDeck={exportDeck}
            onDeleteDeck={handleDeleteDeck}
          />
          <DeckPreview
            selectedDeck={selectedDeck}
            currentDeck={currentDeck}
            cardSize={cardSize}
            editingDeckId={editingDeckId}
            editingDeckNotes={editingDeckNotes}
            onUpdateNotes={onUpdateNotes}
            onUpdateCardZone={onUpdateCardZone}
            onLoadDeckToEdit={onLoadDeckToEdit}
            onDeselectDeck={() => setSelectedDeck(null)}
            onAddToDeck={onAddToDeck}
            onRemoveFromDeck={onRemoveFromDeck}
            onToggleCommander={onToggleCommander}
            activeFormat={activeFormat}
            groupBy={groupBy}
            sortBy={sortBy}
            showToast={showToast}
            onCardSizeChange={setCardSize}
            onSaveNotesDirectly={handleSaveDeckNotesDirectly}
            onApplySuggestedLands={handleApplySuggestedLands}
            onUpdateCard={onUpdateCard}
            onSaveTokens={saveTokensToDeck}
          />
        </div>

        {/* Deck statistics dashboard */}
        {activeStatsDeck.length > 0 && (
          <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-800 pt-4">
            <h3 className="text-gray-900 dark:text-white text-lg font-bold transition-colors duration-300 px-4 mb-2 flex items-center gap-2">
              <FaChartBar className="text-blue-500 shrink-0" />
              <span>{t('deckStats')}</span>
            </h3>
            <DeckStats
              currentDeck={activeStatsDeck}
              onApplySuggestedLands={selectedDeck ? undefined : handleApplySuggestedLands}
            />
          </div>
        )}
      </div>

      {showSaveDialog && (
        <DeckSaveDialog
          deckName={deckName}
          deckFormat={deckFormat}
          onDeckNameChange={setDeckName}
          onDeckFormatChange={setDeckFormat}
          onSave={handleSaveDeck}
          onCancel={() => {
            setShowSaveDialog(false);
            setDeckName('');
          }}
        />
      )}

      {dialogState.isOpen && (
        <CustomDialog
          isOpen={dialogState.isOpen}
          type={dialogState.type}
          title={dialogState.title}
          message={dialogState.message}
          onConfirm={dialogState.onConfirm}
          onCancel={() => setDialogState((prev) => ({ ...prev, isOpen: false }))}
          variant={dialogState.variant}
        />
      )}

      {isTextImportOpen && (
        <div className="modal-overlay animate-fadeIn">
          <div className="modal-container modal-container-small flex flex-col max-h-[90vh] overflow-hidden !p-0">
            {/* Modal Header */}
            <div className="modal-header-container">
              <h3 className="text-gray-900 dark:text-white text-lg font-bold flex items-center gap-2">
                <FaFileImport className="text-blue-500" />
                {t('importTextListTitle')}
              </h3>
              <button
                type="button"
                onClick={() => setIsTextImportOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-all focus:outline-none"
              >
                <FaTimes />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 flex flex-col gap-4 overflow-y-auto">
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('pasteTextList')}</p>

              <textarea
                rows={10}
                value={textDeckList}
                onChange={(e) => setTextDeckList(e.target.value)}
                disabled={isImporting}
                placeholder="4 Lightning Bolt&#10;2 Llanowar Elves&#10;1 Black Lotus"
                className="w-full text-sm font-mono p-3 bg-gray-50 dark:bg-slate-950 text-gray-850 dark:text-slate-100 border border-gray-300 dark:border-slate-850 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none disabled:opacity-60"
              />

              {errorMsg && (
                <div className="text-xs text-red-600 bg-red-50 dark:bg-red-950/20 dark:text-red-400 p-3 rounded-lg border border-red-200 dark:border-red-900/50 flex items-center gap-1.5">
                  <FaExclamationTriangle className="text-red-500 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="modal-footer-container">
              <button
                type="button"
                onClick={() => setIsTextImportOpen(false)}
                disabled={isImporting}
                className="secondary-button text-xs py-2 px-4"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={() => importTextDeck(textDeckList)}
                disabled={isImporting || !textDeckList.trim()}
                className="primary-button text-xs py-2 px-4 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isImporting ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t('importing')}
                  </>
                ) : (
                  <>
                    <FaFileImport />
                    {t('importAction')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DeckManager;
