import { useState, useEffect } from 'react';
import { Card } from '../types/Card';
import { Deck, DeckFormat, DeckRelatedToken } from '../types/Deck';
import { validateDeck, ValidationResult } from '../utils/deckValidator';
import { downloadAsJson } from '../services/fileDownload';

const STORAGE_KEY = 'mtg_decks';

export default function useDeckManager(
  currentDeck: Card[],
  editingDeckId: string | null,
  editingDeckFormat: DeckFormat,
  onCancelEdit: () => void
) {
  const [savedDecks, setSavedDecks] = useState<Deck[]>([]);
  const [deckName, setDeckName] = useState('');
  const [deckFormat, setDeckFormat] = useState<DeckFormat>('freeform');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const [deckValidation, setDeckValidation] = useState<ValidationResult>({
    isValid: true,
    errors: []
  });

  const persistDecks = (decks: Deck[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(decks));
    setSavedDecks(decks);
  };

  useEffect(() => {
    const decksJson = localStorage.getItem(STORAGE_KEY);
    if (decksJson) {
      try {
        setSavedDecks(JSON.parse(decksJson));
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Error parsing saved decks:', e);
      }
    }
  }, []);

  // Recalculate validation whenever deck format or cards change
  useEffect(() => {
    const activeFormat = editingDeckId ? editingDeckFormat : deckFormat;
    setDeckValidation(validateDeck(currentDeck, activeFormat));
  }, [currentDeck, deckFormat, editingDeckFormat, editingDeckId]);

  const saveDeck = (
    name: string,
    format: DeckFormat,
    cards: Card[],
    notes?: string,
    relatedTokens?: DeckRelatedToken[]
  ): { success: boolean; errorKey?: string; createdDeck?: Deck } => {
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

    persistDecks([...savedDecks, newDeck]);
    setDeckName('');
    setShowSaveDialog(false);
    return { success: true, createdDeck: newDeck };
  };

  const saveEditedDeck = (
    id: string,
    name: string,
    format: DeckFormat,
    cards: Card[],
    notes?: string,
    relatedTokens?: DeckRelatedToken[]
  ): { success: boolean } => {
    const updatedDecks = savedDecks.map((deck) =>
      deck.id === id
        ? { ...deck, name: name.trim(), format, cards, notes, relatedTokens: relatedTokens || deck.relatedTokens }
        : deck
    );
    persistDecks(updatedDecks);
    return { success: true };
  };

  const deleteDeck = (deckId: string) => {
    persistDecks(savedDecks.filter((deck) => deck.id !== deckId));

    if (selectedDeck?.id === deckId) {
      setSelectedDeck(null);
    }
    if (editingDeckId === deckId) {
      onCancelEdit();
    }
  };

  const exportDeck = (deck: Deck) => {
    downloadAsJson(deck, `${deck.name.replace(/\s+/g, '_')}.json`);
  };

  const exportAllDecks = () => {
    downloadAsJson(savedDecks, `all-decks-${Date.now()}.json`);
  };

  const saveTokensToDeck = (deckId: string, tokens: { tokenCard: any; generatorCardName: string }[]) => {
    const updatedDecks = savedDecks.map((deck) => (deck.id === deckId ? { ...deck, relatedTokens: tokens } : deck));
    persistDecks(updatedDecks);
  };

  const importDeckFile = async (file: File): Promise<{ success: boolean; errorKey?: string }> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const deck = JSON.parse(e.target?.result as string) as Deck;
          if (!deck.name || !Array.isArray(deck.cards)) {
            resolve({ success: false, errorKey: 'invalidFile' });
            return;
          }
          deck.id = Date.now().toString();
          if (!deck.format) {
            deck.format = 'freeform';
          }
          persistDecks([...savedDecks, deck]);
          resolve({ success: true });
        } catch {
          resolve({ success: false, errorKey: 'invalidFile' });
        }
      };
      reader.onerror = () => resolve({ success: false, errorKey: 'invalidFile' });
      reader.readAsText(file);
    });
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
    saveDeck,
    saveEditedDeck,
    deleteDeck,
    exportDeck,
    exportAllDecks,
    importDeckFile,
    saveTokensToDeck
  };
}
