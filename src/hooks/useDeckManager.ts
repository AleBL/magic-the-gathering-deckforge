import { useState, useEffect } from 'react';
import { Card } from '../types/Card';
import { Deck, DeckFormat, DeckRelatedToken } from '../types/Deck';
import { DeckFormatType } from '../types/enums';
import { validateDeck, ValidationResult } from '../utils/deckValidator';
import { downloadAsJson } from '../services/fileDownload';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { useTranslation } from 'react-i18next';
import { dispatchToast } from '../utils/toastHelper';
import { parseDeckText, fetchCardsFromParsedList, ImportProgressData } from '../services/deckImportService';

export default function useDeckManager(
  currentDeck: Card[],
  editingDeckId: string | null,
  editingDeckFormat: DeckFormat,
  onCancelEdit: () => void
) {
  const savedDecks = useLiveQuery(() => db.decks.toArray()) || [];
  const { t, i18n } = useTranslation();
  const [deckName, setDeckName] = useState('');
  const [deckFormat, setDeckFormat] = useState<DeckFormat>(DeckFormatType.FREEFORM);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const [deckValidation, setDeckValidation] = useState<ValidationResult>({
    isValid: true,
    errors: []
  });

  const [importProgress, setImportProgress] = useState<ImportProgressData>({
    isImporting: false,
    current: 0,
    total: 0,
    message: ''
  });
  const [fileMissingCards, setFileMissingCards] = useState<string[]>([]);
  const [fileImportError, setFileImportError] = useState<string | null>(null);
  const [isFileImportModalOpen, setIsFileImportModalOpen] = useState(false);

  // Recalculate validation whenever deck format or cards change
  useEffect(() => {
    const activeFormat = editingDeckId ? editingDeckFormat : deckFormat;
    setDeckValidation(validateDeck(currentDeck, activeFormat));
  }, [currentDeck, deckFormat, editingDeckFormat, editingDeckId]);

  const saveDeck = async (
    name: string,
    format: DeckFormat,
    cards: Card[],
    notes?: string,
    relatedTokens?: DeckRelatedToken[]
  ): Promise<{ success: boolean; errorKey?: string; createdDeck?: Deck }> => {
    if (!name.trim()) {
      return { success: false, errorKey: 'deckNamePlaceholder' };
    }

    if (cards.length === 0) {
      return { success: false, errorKey: 'addCardsMessage' };
    }

    const newDeck: Deck = {
      id: Date.now().toString(),
      name: name.trim(),
      cards,
      format,
      notes,
      relatedTokens,
      createdAt: new Date().toISOString()
    };

    await db.decks.put(newDeck);
    setDeckName('');
    setShowSaveDialog(false);
    return { success: true, createdDeck: newDeck };
  };

  const saveEditedDeck = async (
    id: string,
    name: string,
    format: DeckFormat,
    cards: Card[],
    notes?: string,
    relatedTokens?: DeckRelatedToken[]
  ): Promise<{ success: boolean }> => {
    const existing = await db.decks.get(id);
    if (existing) {
      await db.decks.put({
        ...existing,
        name: name.trim(),
        format,
        cards,
        notes,
        relatedTokens: relatedTokens || existing.relatedTokens
      });
    }
    return { success: true };
  };

  const deleteDeck = async (deckId: string): Promise<Deck | undefined> => {
    const deckToDelete = await db.decks.get(deckId);
    if (!deckToDelete) return undefined;

    await db.decks.delete(deckId);

    if (selectedDeck?.id === deckId) {
      setSelectedDeck(null);
    }
    if (editingDeckId === deckId) {
      onCancelEdit();
    }

    return deckToDelete;
  };

  const restoreDeck = async (deck: Deck) => {
    const existing = await db.decks.get(deck.id);
    if (existing) return;
    await db.decks.put(deck);
  };

  const exportDeck = (deck: Deck) => {
    downloadAsJson(deck, `${deck.name.replace(/\\s+/g, '_')}.json`);
  };

  const exportDeckAsDec = (deck: Deck) => {
    const cardCounts: Record<string, { count: number; name: string; set?: string; number?: string }> = {};
    deck.cards.forEach((card) => {
      const key = `${card.name}|${card.set || ''}|${card.collector_number || ''}`;
      if (!cardCounts[key]) {
        cardCounts[key] = { count: 0, name: card.name, set: card.set, number: card.collector_number };
      }
      cardCounts[key].count++;
    });

    let content = `// ${deck.name}\n// Format: ${deck.format}\n\n`;
    for (const data of Object.values(cardCounts)) {
      if (data.set && data.number) {
        content += `${data.count} ${data.name} (${data.set.toUpperCase()}) ${data.number}\n`;
      } else {
        content += `${data.count} ${data.name}\n`;
      }
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${deck.name.replace(/\\s+/g, '_')}.dec`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const exportAllDecks = () => {
    downloadAsJson(savedDecks, `all-decks-${Date.now()}.json`);
  };

  const saveTokensToDeck = async (deckId: string, tokens: DeckRelatedToken[]) => {
    const existing = await db.decks.get(deckId);
    if (existing) {
      await db.decks.put({ ...existing, relatedTokens: tokens });
    }
  };

  const importDeckFile = async (file: File): Promise<void> => {
    setIsFileImportModalOpen(true);
    setFileImportError(null);
    setFileMissingCards([]);
    setImportProgress({ isImporting: true, current: 0, total: 100, message: t('common.loading') });

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const content = event.target?.result as string;

          if (file.name.endsWith('.json')) {
            const deck = JSON.parse(content) as Deck;
            if (!deck.name || !Array.isArray(deck.cards)) {
              setFileImportError(t('deck.invalidFile'));
              setImportProgress((prev) => ({ ...prev, isImporting: false }));
              resolve();
              return;
            }
            deck.id = Date.now().toString();
            if (!deck.format) deck.format = DeckFormatType.FREEFORM;
            await db.decks.put(deck);
            setImportProgress((prev) => ({ ...prev, isImporting: false, current: prev.total }));
            dispatchToast(t('deck.deckImported'));
            resolve();
          } else if (file.name.endsWith('.dec') || file.name.endsWith('.txt')) {
            const parsed = parseDeckText(content);
            if (parsed.length === 0) {
              setFileImportError(t('deck.invalidFile'));
              setImportProgress((prev) => ({ ...prev, isImporting: false }));
              resolve();
              return;
            }

            try {
              const currentLang = i18n.language || 'en';
              const { cards, missing } = await fetchCardsFromParsedList(parsed, currentLang, (progress) => {
                setImportProgress(progress);
              });

              setFileMissingCards(missing);

              if (cards.length === 0) {
                setFileImportError(t('deck.importError'));
                setImportProgress((prev) => ({ ...prev, isImporting: false }));
                resolve();
                return;
              }

              const newDeck: Deck = {
                id: Date.now().toString(),
                name: file.name.replace(/\.(dec|txt)$/i, ''),
                cards,
                format: DeckFormatType.FREEFORM,
                createdAt: new Date().toISOString()
              };
              await db.decks.put(newDeck);

              setImportProgress((prev) => ({ ...prev, isImporting: false, current: prev.total }));
              dispatchToast(t('deck.deckImported'));
              resolve();
            } catch {
              setFileImportError(t('deck.importError'));
              setImportProgress((prev) => ({ ...prev, isImporting: false }));
              resolve();
            }
          } else {
            setFileImportError(t('deck.invalidFile'));
            setImportProgress((prev) => ({ ...prev, isImporting: false }));
            resolve();
          }
        } catch {
          setFileImportError(t('deck.invalidFile'));
          setImportProgress((prev) => ({ ...prev, isImporting: false }));
          resolve();
        }
      };
      reader.onerror = () => {
        setFileImportError(t('deck.invalidFile'));
        setImportProgress((prev) => ({ ...prev, isImporting: false }));
        resolve();
      };
      reader.readAsText(file);
    });
  };

  const closeFileImportModal = () => {
    setIsFileImportModalOpen(false);
  };

  return {
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
    importProgress,
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
  };
}
