import { useState, useMemo, useCallback, useRef, useEffect, ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { FaSave, FaPlus, FaTrash, FaFileImport, FaTimes, FaLightbulb, FaBook, FaColumns } from 'react-icons/fa';
import { Card } from '../types/Card';
import { Deck, DeckFormat, DeckRelatedToken } from '../types/Deck';
import { CardSize } from '../types';
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
import { useDeckTextImport } from '../hooks/useDeckTextImport';
import { useSuggestedLands } from '../hooks/useSuggestedLands';

interface DeckManagerProps {
  showToast: (text: string, variant?: any, action?: any) => void;
}

function DeckManager({ showToast }: DeckManagerProps) {
  const { t, i18n } = useTranslation();
  const [cardSize, setCardSize] = useState<CardSize>('small');
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
  }, [deckName, deckFormat, currentDeck, editingDeckNotes, deckRelatedTokens, saveDeck, showAlert, onLoadDeckToEdit, t]);

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
  }, [editingDeckId, editingDeckName, editingDeckFormat, currentDeck, editingDeckNotes, deckRelatedTokens, saveEditedDeck, showAlert, savedDecks, setSelectedDeck, onCancelEdit, t]);

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
      showConfirm(
        t('deck.clearDeckConfirmationTitle'),
        t('deck.clearDeckConfirmationMessage'),
        () => {
          onClearDeck();
          showToast(t('deck.deckCleared'));
        },
        'danger'
      );
      setPendingAction(null);
    }
  }, [pendingAction, editingDeckId, handleSaveEditedDeck, setDeckName, setShowSaveDialog, setPendingAction, showConfirm, t, onClearDeck, showToast]);

  const confirmDeleteDeck = (deck: Deck) => {
    showConfirm(
      t('deck.confirmDelete'),
      t('deck.confirmDelete').replace('?', ` "${deck.name}"?`), // Or just use a specific string if available, falling back to a constructed one
      async () => {
        const deletedDeck = await deleteDeck(deck.id);
        if (deletedDeck) {
          showToast(`${deletedDeck.name} ${t('deck.deleted')}`, {
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
      <div className="workspace-header">
        <div className="manager-title-row">
          <h2 className="text-gray-900 dark:text-white text-2xl font-bold transition-colors duration-300 flex items-center gap-2 w-full">
            <FaBook className="text-blue-600 text-xl" />
            {t('deck.deckManager')}
            <div className="manager-info-tooltip-trigger group/tooltip">
              <button type="button" className="manager-info-tooltip-btn" aria-label={t('common.info')}>
                <FaLightbulb className="text-yellow-500 text-base" />
              </button>
              <div className="manager-info-tooltip-panel">
                <p className="font-medium leading-relaxed">{t('validation.savedLocationNote')}</p>
              </div>
            </div>

            {selectedDeck ? (
              <button
                type="button"
                onClick={() => setShowDeckList(!showDeckList)}
                className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-gray-200 hover:bg-gray-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                title={showDeckList ? t('deck.hideDeckList') : t('deck.showDeckList')}
              >
                <FaColumns className="text-xs shrink-0" />
                <span>{showDeckList ? t('deck.hideDeckList') : t('deck.showDeckList')}</span>
              </button>
            ) : null}
          </h2>
        </div>

        {!selectedDeck ? (
          <div className="manager-toolbar">
            <div className="toolbar-group">
              {editingDeckId ? (
                <div className="toolbar-group-responsive">
                  <button
                    id="save-changes-btn"
                    type="button"
                    onClick={handleSaveEditedDeck}
                    className="primary-button text-xs py-1.5 px-3"
                  >
                    <FaSave className="text-xs shrink-0" />
                    {t('deck.saveChanges')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDeckName(`${editingDeckName} (${t('common.copy')})`);
                      setDeckFormat(editingDeckFormat);
                      setShowSaveDialog(true);
                    }}
                    className="success-button text-xs py-1.5 px-3"
                  >
                    <FaPlus className="text-xs shrink-0" />
                    {t('deck.saveAsNew')}
                  </button>
                  <button type="button" onClick={onCancelEdit} className="danger-button text-xs py-1.5 px-3">
                    <FaTimes className="text-xs shrink-0" />
                    {t('common.cancel')}
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
                  {t('deck.saveCurrentDeck')} ({currentDeck.length} {t('common.cards')})
                </button>
              )}

              <button
                id="clear-deck-btn"
                type="button"
                onClick={() => {
                  showConfirm(
                    t('deck.clearDeckConfirmationTitle'),
                    t('deck.clearDeckConfirmationMessage'),
                    () => {
                      onClearDeck();
                      showToast(t('deck.deckCleared'));
                    },
                    'danger'
                  );
                }}
                disabled={currentDeck.length === 0}
                className="danger-button text-xs py-1.5 px-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaTrash className="text-xs shrink-0" />
                {t('deck.clearCurrentDeck')}
              </button>
            </div>

            <div className="toolbar-actions">
              <div className="relative inline-block text-left">
                <button
                  type="button"
                  onClick={() => setShowImportExportDropdown(!showImportExportDropdown)}
                  className="primary-button text-xs py-1.5 px-3 flex items-center gap-1.5 cursor-pointer"
                >
                  <FaFileImport className="text-xs shrink-0" />
                  {t('deck.importExport')}
                  <span className="text-[10px] opacity-75">▼</span>
                </button>
                {showImportExportDropdown ? (
                  <>
                    <div className="fixed inset-0 z-[100]" onClick={() => setShowImportExportDropdown(false)} />
                    <div className="import-export-dropdown">
                      <span className="import-export-dropdown-section">── {t('common.import')} ──</span>
                      <button
                        type="button"
                        onClick={() => {
                          setShowImportExportDropdown(false);
                          setTextErrorMsg(null);
                          setIsTextImportOpen(true);
                        }}
                        className="import-export-dropdown-item"
                      >
                        <FaFileImport className="text-gray-400 shrink-0" />
                        {t('deck.importTextList')}
                      </button>
                      <label className="import-export-dropdown-item">
                        <FaFileImport className="text-gray-400 shrink-0" />
                        {t('deck.importDeck')}{' '}
                        <span className="text-[10px] text-gray-400 font-mono ml-auto">.json / .dec</span>
                        <input
                          id="deck-import-file-input"
                          type="file"
                          accept=".json,.dec,.txt"
                          onChange={(e) => {
                            setShowImportExportDropdown(false);
                            handleImportDeck(e);
                          }}
                          className="hidden"
                        />
                      </label>
                      {savedDecks.length > 0 ? (
                        <>
                          <div className="import-export-dropdown-divider" />
                          <span className="import-export-dropdown-section">── {t('deck.export')} ──</span>
                          <button
                            type="button"
                            onClick={() => {
                              setShowImportExportDropdown(false);
                              exportAllDecks();
                            }}
                            className="import-export-dropdown-item"
                          >
                            {t('deck.exportAllDecks')}{' '}
                            <span className="text-[10px] text-gray-400 font-mono ml-auto">.json</span>
                          </button>
                        </>
                      ) : null}
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </div>

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
        <div className="modal-overlay z-[200]">
          <div className="modal-container w-full animate-fadeIn">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
              {t('deck.export')} {deckToExport.name}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">{t('export.exportFormatPrompt')}</p>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                className="w-full primary-button bg-indigo-600 hover:bg-indigo-700 py-3"
                onClick={() => {
                  exportDeck(deckToExport);
                  setDeckToExport(null);
                }}
              >
                <div className="font-bold text-lg">JSON</div>
                <div className="text-xs font-normal opacity-80">{t('export.exportJsonDesc')}</div>
              </button>
              <button
                type="button"
                className="w-full primary-button bg-emerald-600 hover:bg-emerald-700 py-3"
                onClick={() => {
                  exportDeckAsDec(deckToExport);
                  setDeckToExport(null);
                }}
              >
                <div className="font-bold text-lg">DEC (MTGO)</div>
                <div className="text-xs font-normal opacity-80">{t('export.exportDecDesc')}</div>
              </button>
              <button type="button" className="w-full mt-2 secondary-button py-2" onClick={() => setDeckToExport(null)}>
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
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
