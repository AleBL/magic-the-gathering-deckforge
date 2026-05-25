import { Card } from './Card';

export type DeckFormat = 'standard' | 'modern' | 'commander' | 'vintage' | 'pauper' | 'freeform';

export interface Deck {
  id: string;
  name: string;
  cards: Card[];
  format: DeckFormat;
  notes?: string;
  createdAt: string;
}
