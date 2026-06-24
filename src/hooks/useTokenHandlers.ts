import { useCallback } from 'react';
import { Card } from '../types/Card';
import { DeckRelatedToken } from '../types/Deck';

type SaveTokensFn = ((deckId: string, tokens: DeckRelatedToken[]) => void) | undefined;

interface UseTokenHandlersParams {
  activeTokens: DeckRelatedToken[];
  selectedDeckId: string | null | undefined;
  editingDeckId: string | null | undefined;
  onSaveTokens: SaveTokensFn;
  manualAdditionLabel: string;
  setSelectedTokenForView: (card: Card | null) => void;
}

/**
 * Centralizes the three token-mutation handlers that were previously
 * defined inline inside DeckPreview, keeping the component leaner.
 */
export function useTokenHandlers({
  activeTokens,
  selectedDeckId,
  editingDeckId,
  onSaveTokens,
  manualAdditionLabel,
  setSelectedTokenForView
}: UseTokenHandlersParams) {
  const persistTokens = useCallback(
    (updated: DeckRelatedToken[]) => {
      if (!onSaveTokens) return;
      if (selectedDeckId) {
        onSaveTokens(selectedDeckId, updated);
      } else if (editingDeckId) {
        onSaveTokens(editingDeckId, updated);
      } else {
        onSaveTokens('', updated);
      }
    },
    [onSaveTokens, selectedDeckId, editingDeckId]
  );

  const handleDeleteTokenCard = useCallback(
    (tokenCard: Card) => {
      const updated = activeTokens.filter((token) => token.tokenCard.id !== tokenCard.id);
      persistTokens(updated);
    },
    [activeTokens, persistTokens]
  );

  const handleAddTokenCardCopy = useCallback(
    (tokenCard: Card) => {
      const uniqueTokenCard = {
        ...tokenCard,
        id: `token-${tokenCard.id.split('-')[1] || tokenCard.id}-${Math.random().toString(36).substring(2, 9)}`
      };
      const newToken: DeckRelatedToken = {
        tokenCard: uniqueTokenCard,
        generatorCardName: manualAdditionLabel,
        isActive: true
      };
      persistTokens([...activeTokens, newToken]);
    },
    [activeTokens, manualAdditionLabel, persistTokens]
  );

  const handleUpdateTokenCard = useCallback(
    (updatedTokenCard: Card) => {
      setSelectedTokenForView(updatedTokenCard);
      const updated = activeTokens.map((token) => {
        const isMatching =
          token.tokenCard.name === updatedTokenCard.name &&
          token.tokenCard.power === updatedTokenCard.power &&
          token.tokenCard.toughness === updatedTokenCard.toughness &&
          token.tokenCard.type_line === updatedTokenCard.type_line;

        if (isMatching) {
          return {
            ...token,
            tokenCard: {
              ...updatedTokenCard,
              id: token.tokenCard.id // preserve unique copy id
            }
          };
        }
        return token;
      });
      persistTokens(updated);
    },
    [activeTokens, persistTokens, setSelectedTokenForView]
  );

  return { handleDeleteTokenCard, handleAddTokenCardCopy, handleUpdateTokenCard };
}
