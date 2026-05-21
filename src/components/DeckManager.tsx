import { useState, ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { FaSave, FaPlus, FaTrash, FaFileImport, FaFileExport, FaTimes, FaLightbulb, FaBook } from 'react-icons/fa';
import { Card } from '../types/Card';
import { DeckFormat } from '../types/Deck';
import { CardSize } from '../types';
import CardSizeSelector from './CardSizeSelector';
import DeckList from './DeckList';
import DeckPreview from './DeckPreview';
import DeckSaveDialog from './DeckSaveDialog';
import DeckValidationBadge from './DeckValidationBadge';
import useDeckManager from '../hooks/useDeckManager';

interface DeckManagerProps {
  currentDeck: Card[];
  onRemoveFromDeck: (card: Card) => void;
  onClearDeck: () => void;
  editingDeckId: string | null;
  editingDeckName: string;
  editingDeckFormat: DeckFormat;
  onLoadDeckToEdit: (id: string, name: string, format: DeckFormat, cards: Card[]) => void;
  onCancelEdit: () => void;
}

function DeckManager({
  currentDeck,
  onRemoveFromDeck,
  onClearDeck,
  editingDeckId,
  editingDeckName,
  editingDeckFormat,
  onLoadDeckToEdit,
  onCancelEdit
}: DeckManagerProps) {
  const { t } = useTranslation();
  const [cardSize, setCardSize] = useState<CardSize>('small');

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
    importDeckFile
  } = useDeckManager(currentDeck, editingDeckId, editingDeckFormat, onCancelEdit);

  const handleSaveDeck = () => {
    const result = saveDeck(deckName, deckFormat, currentDeck);
    if (result.success) {
      // TODO(security): Replace window.alert with in-app notification component
      window.alert(t('deckSaved'));
    } else if (result.errorKey) {
      window.alert(t(result.errorKey));
    }
  };

  const handleSaveEditedDeck = () => {
    if (!editingDeckId) return;
    const result = saveEditedDeck(editingDeckId, editingDeckName, editingDeckFormat, currentDeck);
    if (result.success) {
      window.alert(t('deckSaved'));
    }
  };

  const handleDeleteDeck = (deckId: string) => {
    if (window.confirm(t('confirmDelete'))) {
      deleteDeck(deckId);
    }
  };

  const handleImportDeck = async (event: ChangeEvent<HTMLInputElement>) => {
    const { target } = event;
    const file = target.files?.[0];
    if (!file) return;

    const result = await importDeckFile(file);
    if (result.success) {
      window.alert(t('deckImported'));
    } else if (result.errorKey) {
      window.alert(t(result.errorKey));
    }
    target.value = '';
  };

  const activeFormat = editingDeckId ? editingDeckFormat : deckFormat;

  return (
    <div className="workspace-container">
      <div className="workspace-header">
        {/* Header */}
        <div className="manager-title-row">
          <h2 className="text-gray-900 dark:text-white text-2xl font-bold transition-colors duration-300 flex items-center gap-2">
            <FaBook className="text-blue-600 text-xl" />
            {t('deckManager')}
          </h2>
          <div className="info-note">
            <FaLightbulb className="text-yellow-500 text-lg shrink-0 mt-0.5" />
            <span className="font-semibold">{t('savedLocationNote')}</span>
          </div>
        </div>

        {/* Toolbar */}
        <div className="toolbar-row">
          {editingDeckId ? (
            <>
              <button
                type="button"
                onClick={handleSaveEditedDeck}
                className="primary-button"
              >
                <FaSave className="text-sm shrink-0" />
                {t('saveChanges')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setDeckName(`${editingDeckName} (Cópia)`);
                  setDeckFormat(editingDeckFormat);
                  setShowSaveDialog(true);
                }}
                className="success-button"
              >
                <FaPlus className="text-sm shrink-0" />
                {t('saveAsNew')}
              </button>
              <button
                type="button"
                onClick={onCancelEdit}
                className="danger-button"
              >
                <FaTimes className="text-sm shrink-0" />
                {t('cancel')}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                setDeckName('');
                setShowSaveDialog(true);
              }}
              disabled={currentDeck.length === 0}
              className="success-button"
            >
              <FaSave className="text-sm shrink-0" />
              {t('saveCurrentDeck')} ({currentDeck.length} {t('cards')})
            </button>
          )}

          <button
            type="button"
            onClick={onClearDeck}
            disabled={currentDeck.length === 0}
            className="danger-button"
          >
            <FaTrash className="text-sm shrink-0" />
            {t('clearCurrentDeck')}
          </button>

          <label
            htmlFor="deck-import-file-input"
            className="primary-button cursor-pointer"
          >
            <FaFileImport className="text-sm shrink-0" />
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
            <button
              type="button"
              onClick={exportAllDecks}
              className="purple-button"
            >
              <FaFileExport className="text-sm shrink-0" />
              {t('exportAllDecks')}
            </button>
          )}
        </div>

        {/* Card size selector + validation panel */}
        {currentDeck.length > 0 && (
          <div className="manager-subheader">
            <CardSizeSelector selectedSize={cardSize} onSizeChange={setCardSize} />
            <div className="flex-1 max-w-md">
              <DeckValidationBadge validation={deckValidation} formatKey={activeFormat} />
            </div>
          </div>
        )}
      </div>

      {/* Main content: deck list + preview */}
      <div className="workspace-body">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
          <DeckList
            decks={savedDecks}
            selectedDeckId={selectedDeck?.id ?? null}
            onSelectDeck={setSelectedDeck}
            onEditDeck={onLoadDeckToEdit}
            onExportDeck={exportDeck}
            onDeleteDeck={handleDeleteDeck}
          />
          <DeckPreview
            selectedDeck={selectedDeck}
            currentDeck={currentDeck}
            cardSize={cardSize}
            editingDeckId={editingDeckId}
            onLoadDeckToEdit={onLoadDeckToEdit}
            onDeselectDeck={() => setSelectedDeck(null)}
            onRemoveFromDeck={onRemoveFromDeck}
          />
        </div>
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
    </div>
  );
}

export default DeckManager;
