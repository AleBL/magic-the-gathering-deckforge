import { Card } from '../types/Card';
import { DeckRelatedToken } from '../types/Deck';
import { STORAGE_KEYS } from '../constants/storage';

/**
 * The draft is the deck being built before it has a saved deck behind it. It lives in
 * localStorage so a reload, a crash or closing the window does not throw the work away.
 */
export interface StoredDraft {
  cards: Card[];
  relatedTokens: DeckRelatedToken[];
}

const EMPTY_DRAFT: StoredDraft = { cards: [], relatedTokens: [] };

/** Writes are batched: adding a playset fires four updates in a row. */
const WRITE_DELAY_MS = 250;

let pendingWrite: ReturnType<typeof setTimeout> | null = null;

export function readDraft(): StoredDraft {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.draftDeck);
    if (!raw) return EMPTY_DRAFT;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return EMPTY_DRAFT;
    const { cards, relatedTokens } = parsed as Partial<StoredDraft>;
    return {
      cards: Array.isArray(cards) ? cards : [],
      relatedTokens: Array.isArray(relatedTokens) ? relatedTokens : []
    };
  } catch {
    // Unreadable or blocked storage: start empty rather than fail to boot.
    return EMPTY_DRAFT;
  }
}

function writeNow(draft: StoredDraft) {
  try {
    if (draft.cards.length === 0 && draft.relatedTokens.length === 0) {
      localStorage.removeItem(STORAGE_KEYS.draftDeck);
    } else {
      localStorage.setItem(STORAGE_KEYS.draftDeck, JSON.stringify(draft));
    }
  } catch {
    // Quota or private mode: the draft still lives in memory for this session.
  }
}

export function writeDraft(draft: StoredDraft) {
  if (pendingWrite) clearTimeout(pendingWrite);
  pendingWrite = setTimeout(() => {
    pendingWrite = null;
    writeNow(draft);
  }, WRITE_DELAY_MS);
}

/** Flushes a batched write immediately; used before the page goes away and by tests. */
export function flushDraft(draft: StoredDraft) {
  if (pendingWrite) clearTimeout(pendingWrite);
  pendingWrite = null;
  writeNow(draft);
}
