import { Card } from './Card';

/** Which Scryfall price column drives value and "missing" estimates. */
export type Currency = 'usd' | 'eur';

/**
 * One row of the personal collection, keyed by a specific printing
 * (Scryfall print id). Quantity is tracked per edition — two prints of the
 * same card are two entries. A card can be owned (`quantity > 0`), wishlisted,
 * or both. The full {@link Card} snapshot is stored so the collection renders
 * offline and prices survive even if the card later leaves search results.
 */
export interface CollectionEntry {
  /** Scryfall print id (`card.id`). Primary key. */
  id: string;
  /** Groups printings of the same card together (`card.oracle_id`). */
  oracleId: string;
  /** Card name — used for indexing, filtering and deck matching. */
  name: string;
  set?: string;
  rarity: string;
  /** Owned copies of this printing (>= 0). */
  quantity: number;
  wishlist: boolean;
  /** Full card snapshot for display and pricing. */
  card: Card;
  updatedAt: string;
}
