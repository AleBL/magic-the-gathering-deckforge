import { useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { Card } from '../types/Card';
import { decrementOwned, incrementOwned, setOwnedQuantity, toggleWishlist } from '../services/collectionService';

/**
 * Scoped collection state for a single card/printing. Uses a targeted live
 * query so each card only re-renders when its own entry changes, not on every
 * collection mutation.
 */
export function useCardCollection(card: Card) {
  const entry = useLiveQuery(() => db.collection.get(card.id), [card.id]);

  const quantity = entry?.quantity ?? 0;
  const wishlist = entry?.wishlist ?? false;

  const increment = useCallback(() => incrementOwned(card), [card]);
  const decrement = useCallback(() => decrementOwned(card), [card]);
  const setQuantity = useCallback((next: number) => setOwnedQuantity(card, next), [card]);
  const toggleWish = useCallback(() => toggleWishlist(card), [card]);

  return { quantity, wishlist, increment, decrement, setQuantity, toggleWishlist: toggleWish };
}
