import { Card } from './Card';

export type DeckFormat = 'standard' | 'modern' | 'commander' | 'vintage' | 'pauper' | 'freeform';

export interface DeckRelatedToken {
  tokenCard: Card;
  generatorCardName: string;
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
