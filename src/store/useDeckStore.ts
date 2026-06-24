import { create } from 'zustand';
import { Card } from '../types/Card';
import { DeckFormat, DeckRelatedToken } from '../types/Deck';
import { DeckFormatType, DeckZone } from '../types/enums';

interface EditingDeckState {
  deckId: string | null;
  deckName: string;
  deckFormat: DeckFormat;
  deckNotes?: string;
}

interface DeckStoreState {
  currentDeck: Card[];
  currentDeckRelatedTokens: DeckRelatedToken[];
  editingDeck: EditingDeckState;

  setCurrentDeck: (cards: Card[]) => void;
  setCurrentDeckRelatedTokens: (
    tokens: DeckRelatedToken[] | ((prev: DeckRelatedToken[]) => DeckRelatedToken[])
  ) => void;
  setEditingDeck: (state: EditingDeckState) => void;

  addCard: (card: Card) => void;
  removeCard: (cardId: string) => Card | null;
  updateCard: (updatedCard: Card) => void;
  updateCardZone: (cardId: string, zone: DeckZone) => void;
  toggleCommander: (cardId: string) => void;
  clearDeck: () => void;
  updateNotes: (notes: string) => void;
  updateDeckName: (name: string) => void;
  updateDeckFormat: (format: DeckFormat) => void;
  cancelEdit: () => void;
  loadDeckToEdit: (
    id: string,
    name: string,
    format: DeckFormat,
    cards: Card[],
    notes?: string,
    relatedTokens?: DeckRelatedToken[]
  ) => void;
  
  pendingAction: string | null;
  setPendingAction: (action: string | null) => void;
}

const INITIAL_EDITING_STATE: EditingDeckState = {
  deckId: null,
  deckName: '',
  deckFormat: DeckFormatType.FREEFORM,
  deckNotes: ''
};

export const useDeckStore = create<DeckStoreState>((set) => ({
  currentDeck: [],
  currentDeckRelatedTokens: [],
  editingDeck: INITIAL_EDITING_STATE,
  pendingAction: null,

  setPendingAction: (action) => set({ pendingAction: action }),

  setCurrentDeck: (cards) => set({ currentDeck: cards }),

  setCurrentDeckRelatedTokens: (tokens) =>
    set((state) => ({
      currentDeckRelatedTokens: typeof tokens === 'function' ? tokens(state.currentDeckRelatedTokens) : tokens
    })),

  setEditingDeck: (editingState) => set({ editingDeck: editingState }),

  addCard: (card) => set((state) => ({ currentDeck: [...state.currentDeck, card] })),

  removeCard: (cardId) => {
    let removedCard: Card | null = null;
    set((state) => {
      const index = state.currentDeck.findIndex((card) => card.id === cardId);
      if (index > -1) {
        const newDeck = [...state.currentDeck];
        removedCard = newDeck.splice(index, 1)[0];
        const remains = newDeck.some((card) => card.name === removedCard!.name);

        let newTokens = state.currentDeckRelatedTokens;
        if (!remains) {
          const cardName = removedCard!.name;
          const printedName = removedCard!.printed_name || removedCard!.name;
          newTokens = state.currentDeckRelatedTokens.filter(
            (token) => token.generatorCardName !== cardName && token.generatorCardName !== printedName
          );
        }
        return { currentDeck: newDeck, currentDeckRelatedTokens: newTokens };
      }
      return state;
    });
    return removedCard;
  },

  updateCard: (updatedCard) =>
    set((state) => ({
      currentDeck: state.currentDeck.map((card) => (card.id === updatedCard.id ? updatedCard : card))
    })),

  updateCardZone: (cardId, zone) =>
    set((state) => ({
      currentDeck: state.currentDeck.map((card) => (card.id === cardId ? { ...card, zone } : card))
    })),

  toggleCommander: (cardId) =>
    set((state) => {
      const index = state.currentDeck.findIndex((card) => card.id === cardId);
      if (index === -1) return state;

      const isCurrentlyCommander = !!state.currentDeck[index].isCommander;

      if (isCurrentlyCommander) {
        return {
          currentDeck: state.currentDeck.map((card, idx) => (idx === index ? { ...card, isCommander: false } : card))
        };
      } else {
        const currentCommanders = state.currentDeck.filter((card) => card.isCommander);
        if (currentCommanders.length >= 2) {
          const commanderToKeep = currentCommanders[currentCommanders.length - 1];
          return {
            currentDeck: state.currentDeck.map((card, idx) => {
              if (idx === index) return { ...card, isCommander: true };
              if (card.id === commanderToKeep.id) return { ...card, isCommander: true };
              return { ...card, isCommander: false };
            })
          };
        } else {
          return {
            currentDeck: state.currentDeck.map((card, idx) => (idx === index ? { ...card, isCommander: true } : card))
          };
        }
      }
    }),

  clearDeck: () => set({ currentDeck: [], currentDeckRelatedTokens: [] }),

  updateNotes: (notes) => set((state) => ({ editingDeck: { ...state.editingDeck, deckNotes: notes } })),
  updateDeckName: (name) => set((state) => ({ editingDeck: { ...state.editingDeck, deckName: name } })),
  updateDeckFormat: (format) => set((state) => ({ editingDeck: { ...state.editingDeck, deckFormat: format } })),

  cancelEdit: () =>
    set({
      editingDeck: INITIAL_EDITING_STATE,
      currentDeck: [],
      currentDeckRelatedTokens: []
    }),

  loadDeckToEdit: (id, name, format, cards, notes, relatedTokens) =>
    set({
      editingDeck: { deckId: id, deckName: name, deckFormat: format, deckNotes: notes || '' },
      currentDeck: cards,
      currentDeckRelatedTokens: relatedTokens || []
    })
}));
