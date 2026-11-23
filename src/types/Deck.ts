import { Card } from './Card';
import { DeckFormatType } from './enums';

export type DeckFormat = DeckFormatType;

export interface DeckRelatedToken {
  tokenCard: Card;
  generatorCardName: string;
  isActive?: boolean;
}

export interface Deck {
  id: string;
  name: string;
  cards: Card[];
  format: DeckFormat;
  notes?: string;
  createdAt: string;
  relatedTokens?: DeckRelatedToken[];
  /** Non-indexed on purpose: Dexie persists unlisted fields as-is, so this needs no schema
   *  bump. Unset falls back to the commander or the best available art. */
  coverCardId?: string;
  /** Free-form labels for the library filter. Non-indexed like coverCardId: no schema bump. */
  tags?: string[];
}

export type MatchResult = 'win' | 'loss' | 'draw';

/** One game logged against a saved deck, for the win rate by matchup. */
export interface MatchRecord {
  id: string;
  deckId: string;
  result: MatchResult;
  /** What the opponent played, as the user names it ("Mono-red", "Azorius control"). */
  opponent: string;
  /** Whether this deck went first. */
  onPlay: boolean;
  notes?: string;
  playedAt: string;
}

export interface DeckVersion {
  id: string;
  deckId: string;
  name: string;
  format: DeckFormat;
  cards: Card[];
  relatedTokens?: DeckRelatedToken[];
  createdAt: string;
}
