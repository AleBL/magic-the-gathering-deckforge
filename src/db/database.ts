import Dexie, { type Table } from 'dexie';
import { Deck } from '../types/Deck';

export class MagicDatabase extends Dexie {
  decks!: Table<Deck, string>;

  constructor() {
    super('MagicDecksDB');
    this.version(1).stores({
      decks: 'id, name, format, createdAt'
    });
  }
}

export const db = new MagicDatabase();
