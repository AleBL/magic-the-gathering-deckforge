import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushDraft, readDraft, writeDraft } from '../draftStorage';
import { STORAGE_KEYS } from '../../constants/storage';
import type { Card } from '../../types/Card';

const bolt = { id: 'bolt', name: 'Lightning Bolt' } as Card;

describe('draftStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('reads an empty draft when nothing was stored', () => {
    expect(readDraft()).toEqual({ cards: [], relatedTokens: [] });
  });

  it('round-trips the cards once the batched write lands', () => {
    writeDraft({ cards: [bolt], relatedTokens: [] });
    expect(localStorage.getItem(STORAGE_KEYS.draftDeck)).toBeNull();

    vi.runAllTimers();
    expect(readDraft().cards.map((card) => card.name)).toEqual(['Lightning Bolt']);
  });

  it('keeps only the last of several quick writes', () => {
    writeDraft({ cards: [bolt], relatedTokens: [] });
    writeDraft({ cards: [bolt, bolt], relatedTokens: [] });
    vi.runAllTimers();
    expect(readDraft().cards).toHaveLength(2);
  });

  it('removes the stored draft when it is emptied', () => {
    flushDraft({ cards: [bolt], relatedTokens: [] });
    flushDraft({ cards: [], relatedTokens: [] });
    expect(localStorage.getItem(STORAGE_KEYS.draftDeck)).toBeNull();
  });

  it('ignores a stored value it cannot read instead of failing to boot', () => {
    localStorage.setItem(STORAGE_KEYS.draftDeck, '{not json');
    expect(readDraft()).toEqual({ cards: [], relatedTokens: [] });

    localStorage.setItem(STORAGE_KEYS.draftDeck, JSON.stringify({ cards: 'nope' }));
    expect(readDraft()).toEqual({ cards: [], relatedTokens: [] });
  });
});

describe('the deck store draft', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('stores cards added to the draft and clears them once the draft becomes a saved deck', async () => {
    const { useDeckStore } = await import('../useDeckStore');
    useDeckStore.getState().cancelEdit();
    useDeckStore.getState().addCard(bolt);
    vi.runAllTimers();
    expect(readDraft().cards).toHaveLength(1);

    useDeckStore.getState().loadDeckToEdit('deck-1', 'Burn', 'modern', [bolt]);
    vi.runAllTimers();
    expect(readDraft().cards).toHaveLength(0);

    // Edits to the saved deck never leak into the draft.
    useDeckStore.getState().addCard({ ...bolt, id: 'bolt-2' } as Card);
    vi.runAllTimers();
    expect(readDraft().cards).toHaveLength(0);
  });
});
