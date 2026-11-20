import Dexie, { type Table } from 'dexie';
import { Deck, DeckVersion, MatchRecord } from '../types/Deck';
import { CollectionEntry } from '../types/Collection';

class MagicDatabase extends Dexie {
  decks!: Table<Deck, string>;
  collection!: Table<CollectionEntry, string>;
  deckVersions!: Table<DeckVersion, string>;
  matches!: Table<MatchRecord, string>;

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
    // v3 adds per-deck version snapshots (deck history).
    this.version(3).stores({
      decks: 'id, name, format, createdAt',
      collection: 'id, oracleId, name, set, rarity, updatedAt',
      deckVersions: 'id, deckId, createdAt'
    });
    // v4 adds the match log. Earlier stores are restated unchanged.
    this.version(4).stores({
      decks: 'id, name, format, createdAt',
      collection: 'id, oracleId, name, set, rarity, updatedAt',
      deckVersions: 'id, deckId, createdAt',
      matches: 'id, deckId, playedAt'
    });
  }
}

export const db = new MagicDatabase();
