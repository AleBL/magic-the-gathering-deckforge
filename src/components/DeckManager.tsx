import { useState, useMemo, useCallback, useRef, useEffect, ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../types/Card';
import { Deck, DeckFormat, DeckRelatedToken } from '../types/Deck';
import { CardSize } from '../types';
import { ShowToastFn } from '../types/Toast';
import { CARD_SIZES } from '../constants';
import DeckList from './DeckList';
import DeckPreview from './DeckPreview';
import DeckSaveDialog from './DeckSaveDialog';
import CustomDialog from './ui/CustomDialog';
import { useDeckStore } from '../store/useDeckStore';
import { useDeckActions } from '../hooks/useDeckActions';
import useDeckManager from '../hooks/useDeckManager';
import useDialog from '../hooks/useDialog';
import DeckTextImportModal from './deck/DeckTextImportModal';
import DeckImportProgressModal from './deck/DeckImportProgressModal';
import { DeckManagerToolbar } from './deck/DeckManagerToolbar';
import { DeckExportDialog } from './deck/DeckExportDialog';
import { useDeckTextImport } from '../hooks/useDeckTextImport';
import { useSuggestedLands } from '../hooks/useSuggestedLands';

interface DeckManagerProps {
  readonly showToast: ShowToastFn;
}

function DeckManager({ showToast }: DeckManagerProps) {
  const { t, i18n } = useTranslation();
  const [cardSize, setCardSize] = useState<CardSize>(() => {
    const saved = localStorage.getItem('deckforge_card_size');
    return saved && (CARD_SIZES as readonly string[]).includes(saved) ? (saved as CardSize) : 'small';
  });

  useEffect(() => {
    localStorage.setItem('deckforge_card_size', cardSize);
  }, [cardSize]);
  const [showDeckList, setShowDeckList] = useState(true);
  const [showImportExportDropdown, setShowImportExportDropdown] = useState(false);

  const currentDeck = useDeckStore((state) => state.currentDeck);
  const deckRelatedTokens = useDeckStore((state) => state.currentDeckRelatedTokens);
  const editingDeckId = useDeckStore((state) => state.editingDeck.deckId);
  const editingDeckName = useDeckStore((state) => state.editingDeck.deckName);
  const editingDeckFormat = useDeckStore((state) => state.editingDeck.deckFormat);
  const editingDeckNotes = useDeckStore((state) => state.editingDeck.deckNotes);

  const onUpdateCardZone = useDeckStore((state) => state.updateCardZone);
  const onLoadDeckToEdit = useDeckStore((state) => state.loadDeckToEdit);
  const onCancelEdit = useDeckStore((state) => state.cancelEdit);
  const onUpdateCard = useDeckStore((state) => state.updateCard);
  const onUpdateNotes = useDeckStore((state) => state.updateNotes);
  const onToggleCommander = useDeckStore((state) => state.toggleCommander);
  const onClearDeck = useDeckStore((state) => state.clearDeck);
  const onUpdateTokens = useDeckStore((state) => state.setCurrentDeckRelatedTokens);

  const { handleAddToDeck, handleRemoveFromDeckWithToast } = useDeckActions(showToast);

  const [isTextImportOpen, setIsTextImportOpen] = useState(false);

  const lastEditingIdRef = useRef<string | null>(null);

  const { dialogState, showAlert, showConfirm, closeDialog } = useDialog();

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
    importProgress: fileImportProgress,
    saveDeck,
    saveEditedDeck,
    deleteDeck,
    exportDeck,
    exportDeckAsDec,
    exportAllDecks,
    importDeckFile,
    saveTokensToDeck,
    restoreDeck,
    fileMissingCards,
    fileImportError,
    isFileImportModalOpen,
    closeFileImportModal
  } = useDeckManager(currentDeck, editingDeckId, editingDeckFormat, onCancelEdit);

  const pendingAction = useDeckStore((state) => state.pendingAction);
  const setPendingAction = useDeckStore((state) => state.setPendingAction);

  const [deckToExport, setDeckToExport] = useState<Deck | null>(null);

  useEffect(() => {
    if (editingDeckId) {
      lastEditingIdRef.current = editingDeckId;
    } else if (lastEditingIdRef.current) {
      const deckToSelect = savedDecks.find((d) => d.id === lastEditingIdRef.current);
      if (deckToSelect && (!selectedDeck || selectedDeck.id !== deckToSelect.id)) {
        setSelectedDeck(deckToSelect);
      }
      lastEditingIdRef.current = null;
    }
  }, [editingDeckId, savedDecks, selectedDeck, setSelectedDeck]);

  const activeFormat = editingDeckId ? editingDeckFormat : deckFormat;

  const displayDecks = useMemo(() => {
    if (!editingDeckId) return savedDecks;
    let found = false;
    const mapped = savedDecks.map((deck) => {
      if (deck.id === editingDeckId) {
        found = true;
        return { ...deck, name: editingDeckName, format: editingDeckFormat };
      }
      return deck;
    });

    if (!found && editingDeckId) {
      mapped.unshift({
        id: editingDeckId,
        name: editingDeckName || t('deck.unnamedDeck'),
        format: editingDeckFormat,
        cards: currentDeck,
        notes: editingDeckNotes,
        relatedTokens: deckRelatedTokens,
        createdAt: new Date().toISOString()
      });
    }
    return mapped;
  }, [
    savedDecks,
    editingDeckId,
    editingDeckName,
    editingDeckFormat,
    currentDeck,
    editingDeckNotes,
    deckRelatedTokens,
    t
  ]);

  const {
    isImporting: isTextImporting,
    errorMsg: textImportErrorMsg,
    setErrorMsg: setTextErrorMsg,
    importTextDeck,
    isProgressModalOpen,
    setIsProgressModalOpen,
    importProgress: textImportProgress,
    missingCards: textMissingCards,
    finishImport: finishTextImport
  } = useDeckTextImport(
    i18n,
    editingDeckId,
    editingDeckName,
    editingDeckFormat,
    onLoadDeckToEdit,
    showToast,
    showAlert,
    setIsTextImportOpen
  );

  const { handleApplySuggestedLands } = useSuggestedLands(
    currentDeck,
    editingDeckId,
    editingDeckName,
    activeFormat,
    editingDeckNotes,
    onLoadDeckToEdit,
    showToast,
    t
  );

  const handleSaveDeck = useCallback(async () => {
    const result = await saveDeck(deckName, deckFormat, currentDeck, editingDeckNotes, deckRelatedTokens);
    if (result.success && result.createdDeck) {
      showAlert(t('common.successTitle'), t('deck.deckSaved'), 'success');
      onLoadDeckToEdit(
        result.createdDeck.id,
        result.createdDeck.name,
        result.createdDeck.format,
        result.createdDeck.cards,
        result.createdDeck.notes,
        result.createdDeck.relatedTokens
      );
    } else if (result.errorKey) {
      showAlert(t('common.errorTitle'), t(result.errorKey), 'danger');
    }
  }, [
    deckName,
    deckFormat,
    currentDeck,
    editingDeckNotes,
    deckRelatedTokens,
    saveDeck,
    showAlert,
    onLoadDeckToEdit,
    t
  ]);

  const handleSaveEditedDeck = useCallback(async () => {
    if (!editingDeckId) return;
    const result = await saveEditedDeck(
      editingDeckId,
      editingDeckName,
      editingDeckFormat,
      currentDeck,
      editingDeckNotes,
      deckRelatedTokens
    );
    if (result.success) {
      showAlert(t('common.successTitle'), t('deck.deckSaved'), 'success');
      const updatedDeck = {
        id: editingDeckId,
        name: editingDeckName,
        format: editingDeckFormat,
        cards: currentDeck,
        notes: editingDeckNotes,
        relatedTokens: deckRelatedTokens,
        createdAt: savedDecks.find((d: Deck) => d.id === editingDeckId)?.createdAt || new Date().toISOString()
      };
      setSelectedDeck(updatedDeck);
      onCancelEdit();
    }
  }, [
    editingDeckId,
    editingDeckName,
    editingDeckFormat,
    currentDeck,
    editingDeckNotes,
    deckRelatedTokens,
    saveEditedDeck,
    showAlert,
    savedDecks,
    setSelectedDeck,
    onCancelEdit,
    t
  ]);

  const clearDeckWithConfirm = useCallback(() => {
    showConfirm(
      t('deck.clearDeckConfirmationTitle'),
      t('deck.clearDeckConfirmationMessage'),
      () => {
        onClearDeck();
        showToast(t('deck.deckCleared'));
      },
      'danger'
    );
  }, [showConfirm, t, onClearDeck, showToast]);

  useEffect(() => {
    if (pendingAction === 'save-deck') {
      if (editingDeckId) {
        handleSaveEditedDeck();
      } else {
        setDeckName('');
        setShowSaveDialog(true);
      }
      setPendingAction(null);
    } else if (pendingAction === 'clear-deck') {
      clearDeckWithConfirm();
      setPendingAction(null);
    }
  }, [
    pendingAction,
    editingDeckId,
    handleSaveEditedDeck,
    setDeckName,
    setShowSaveDialog,
    setPendingAction,
    clearDeckWithConfirm
  ]);

  const confirmDeleteDeck = (deck: Deck) => {
    showConfirm(
      t('deck.confirmDelete'),
      t('deck.confirmDelete').replace('?', ` "${deck.name}"?`), // Or just use a specific string if available, falling back to a constructed one
      async () => {
        const deletedDeck = await deleteDeck(deck.id);
        if (deletedDeck) {
          showToast(`${deletedDeck.name} ${t('deck.deleted')}`, undefined, {
            label: t('common.undo'),
            onClick: () => {
              restoreDeck(deletedDeck);
            }
          });
        }
      },
      'danger'
    );
  };

  const handleSaveDeckNotesDirectly = (deckId: string, notes: string) => {
    const deckToUpdate = savedDecks.find((deck: Deck) => deck.id === deckId);
    if (!deckToUpdate) return;

    saveEditedDeck(deckToUpdate.id, deckToUpdate.name, deckToUpdate.format, deckToUpdate.cards, notes);
    setSelectedDeck((previousSelectedDeck: Deck | null) =>
      previousSelectedDeck && previousSelectedDeck.id === deckId
        ? { ...previousSelectedDeck, notes }
        : previousSelectedDeck
    );
    showToast(t('deck.deckSaved'));
  };

  const handleImportDeck = async (event: ChangeEvent<HTMLInputElement>) => {
    const { target } = event;
    const file = target.files?.[0];
    if (!file) return;

    await importDeckFile(file);
    target.value = '';
  };

  const handleEditDeck = useCallback(
    (
      id: string,
      name: string,
      format: DeckFormat,
      cards: Deck['cards'],
      notes?: string,
      relatedTokens?: Deck['relatedTokens']
    ) => {
      setSelectedDeck(null);
      onLoadDeckToEdit(id, name, format, cards, notes, relatedTokens);
    },
    [setSelectedDeck, onLoadDeckToEdit]
  );

  const handleLoadDeckToEdit = useCallback(
    (
      id: string,
      name: string,
      format: DeckFormat,
      cards: Deck['cards'],
      notes?: string,
      relatedTokens?: Deck['relatedTokens']
    ) => {
      setSelectedDeck(null);
      onLoadDeckToEdit(id, name, format, cards, notes, relatedTokens || selectedDeck?.relatedTokens);
    },
    [setSelectedDeck, onLoadDeckToEdit, selectedDeck]
  );

  const handleDeselectDeck = useCallback(() => {
    setSelectedDeck(null);
    setShowDeckList(true);
  }, [setSelectedDeck, setShowDeckList]);

  const handleSaveTokens = useCallback(
    (deckId: string, tokens: DeckRelatedToken[]) => {
      onUpdateTokens(tokens);
      saveTokensToDeck(deckId, tokens);
    },
    [onUpdateTokens, saveTokensToDeck]
  );

  const handleToggleCommander = useCallback(
    (card: Card) => {
      onToggleCommander(card.id);
    },
    [onToggleCommander]
  );

  return (
    <div className="workspace-container">
      <DeckManagerToolbar
        selectedDeck={selectedDeck}
        showDeckList={showDeckList}
        onToggleDeckList={() => setShowDeckList(!showDeckList)}
        editingDeckId={editingDeckId}
        currentDeckCount={currentDeck.length}
        hasSavedDecks={savedDecks.length > 0}
        showImportExportDropdown={showImportExportDropdown}
        setShowImportExportDropdown={setShowImportExportDropdown}
        onSaveChanges={handleSaveEditedDeck}
        onSaveAsNew={() => {
          setDeckName(`${editingDeckName} (${t('common.copy')})`);
          setDeckFormat(editingDeckFormat);
          setShowSaveDialog(true);
        }}
        onCancelEdit={onCancelEdit}
        onOpenSaveDialog={() => {
          setDeckName('');
          setShowSaveDialog(true);
        }}
        onClearDeck={clearDeckWithConfirm}
        onOpenTextImport={() => {
          setTextErrorMsg(null);
          setIsTextImportOpen(true);
        }}
        onImportFile={handleImportDeck}
        onExportAll={exportAllDecks}
      />

      <div className="workspace-body">
        <div
          className={`grid grid-cols-1 ${showDeckList ? 'lg:grid-cols-[300px_1fr] xl:grid-cols-[320px_1fr]' : 'lg:grid-cols-1'} gap-4 p-4`}
        >
          {showDeckList ? (
            <div className="col-span-1">
              <DeckList
                decks={displayDecks}
                selectedDeckId={selectedDeck?.id ?? null}
                editingDeckId={editingDeckId}
                onSelectDeck={setSelectedDeck}
                onEditDeck={handleEditDeck}
                onExportDeck={(deck) => setDeckToExport(deck)}
                onDeleteDeck={confirmDeleteDeck}
              />
            </div>
          ) : null}
          <div className="col-span-1 min-w-0">
            <DeckPreview
              selectedDeck={selectedDeck}
              currentDeck={currentDeck}
              cardSize={cardSize}
              editingDeckId={editingDeckId}
              editingDeckNotes={editingDeckNotes}
              onUpdateNotes={onUpdateNotes}
              onUpdateCardZone={onUpdateCardZone}
              onLoadDeckToEdit={handleLoadDeckToEdit}
              onDeselectDeck={handleDeselectDeck}
              onAddToDeck={handleAddToDeck}
              onRemoveFromDeck={handleRemoveFromDeckWithToast}
              onToggleCommander={handleToggleCommander}
              activeFormat={activeFormat}
              showToast={showToast}
              onCardSizeChange={setCardSize}
              onSaveNotesDirectly={handleSaveDeckNotesDirectly}
              onApplySuggestedLands={handleApplySuggestedLands}
              onUpdateCard={onUpdateCard}
              onSaveTokens={handleSaveTokens}
              deckRelatedTokens={selectedDeck ? selectedDeck.relatedTokens : deckRelatedTokens}
            />
          </div>
        </div>
      </div>

      {showSaveDialog ? (
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
      ) : null}

      {dialogState.isOpen ? (
        <CustomDialog
          isOpen={dialogState.isOpen}
          type={dialogState.type}
          title={dialogState.title}
          message={dialogState.message}
          onConfirm={dialogState.onConfirm}
          onCancel={closeDialog}
          variant={dialogState.variant}
        />
      ) : null}

      {deckToExport ? (
        <DeckExportDialog
          deck={deckToExport}
          onExportJson={(deck) => {
            exportDeck(deck);
            setDeckToExport(null);
          }}
          onExportDec={(deck) => {
            exportDeckAsDec(deck);
            setDeckToExport(null);
          }}
          onCancel={() => setDeckToExport(null)}
        />
      ) : null}

      <DeckTextImportModal
        isOpen={isTextImportOpen}
        onClose={() => setIsTextImportOpen(false)}
        onImport={importTextDeck}
        isImporting={isTextImporting}
        errorMsg={textImportErrorMsg}
      />

      <DeckImportProgressModal
        isOpen={isProgressModalOpen}
        progress={textImportProgress}
        missingCards={textMissingCards}
        errorMsg={textImportErrorMsg}
        onClose={() => setIsProgressModalOpen(false)}
        onFinish={finishTextImport}
      />

      <DeckImportProgressModal
        isOpen={isFileImportModalOpen}
        progress={fileImportProgress}
        missingCards={fileMissingCards}
        errorMsg={fileImportError}
        onClose={closeFileImportModal}
      />
    </div>
  );
}

export default DeckManager;
