type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

/**
 * Shared wording for the deck save/clear actions, naming the exact deck that
 * will be affected. Used by both the desktop toolbar and the mobile page menu
 * so the two surfaces can never drift apart.
 */
export function deckActionLabels(t: TranslateFn, editingDeckId: string | null, editingDeckName: string) {
  const saveLabel = editingDeckId
    ? editingDeckName
      ? t('deck.saveDeckNamed', { name: editingDeckName })
      : t('deck.saveChanges')
    : t('deck.saveDeck');
  const clearLabel =
    editingDeckId && editingDeckName
      ? t('deck.clearDeckNamed', { name: editingDeckName })
      : t('deck.clearTemporaryDeck');
  return { saveLabel, clearLabel };
}
