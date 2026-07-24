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
}

/** Point-in-time snapshot of a deck, kept for the version history feature. */
export interface DeckVersion {
  id: string;
  deckId: string;
  name: string;
  format: DeckFormat;
  cards: Card[];
  relatedTokens?: DeckRelatedToken[];
  createdAt: string;
}
