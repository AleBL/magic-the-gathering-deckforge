import Dexie, { type Table } from 'dexie';
import { Deck } from '../types/Deck';
import { CollectionEntry } from '../types/Collection';

class MagicDatabase extends Dexie {
  decks!: Table<Deck, string>;
  collection!: Table<CollectionEntry, string>;

  constructor() {
    super('MagicDecksDB');
    this.version(1).stores({
      decks: 'id, name, format, createdAt'
    });
    // v2 introduces the personal collection. Existing decks carry over
    // untouched — Dexie keeps unlisted stores intact across upgrades.
    this.version(2).stores({
      decks: 'id, name, format, createdAt',
      collection: 'id, oracleId, name, set, rarity, updatedAt'
    });
  }
}

export const db = new MagicDatabase();
