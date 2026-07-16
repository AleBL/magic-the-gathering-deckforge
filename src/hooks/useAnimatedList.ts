import { useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

export interface AnimatedEntry<T> {
  key: string;
  item: T;
  isLeaving: boolean;
}

/**
 * Keeps items that just dropped out of `items` rendered a little longer
 * (isLeaving: true) instead of vanishing the instant they're gone, so a row
 * can fade/slide out instead of the list flickering. Reduced-motion users
 * skip the hold entirely. One instance per rendered list — see
 * DeckCardList.tsx's AnimatedDeckCardGroup for why this can't just be
 * called inline inside a `.map()` (Rules of Hooks: a variable number of
 * groups would mean a variable number of hook calls).
 */
export function useAnimatedList<T>(items: T[], getKey: (item: T) => string, exitMs = 200): AnimatedEntry<T>[] {
  const [entries, setEntries] = useState<AnimatedEntry<T>[]>(() =>
    items.map((item) => ({ key: getKey(item), item, isLeaving: false }))
  );
  const prefersReducedMotion = usePrefersReducedMotion();
  const timeoutsRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    const remaining = new Map(items.map((item) => [getKey(item), item]));

    setEntries((current) => {
      const next: AnimatedEntry<T>[] = [];

      for (const entry of current) {
        const item = remaining.get(entry.key);
        if (item !== undefined) {
          next.push({ key: entry.key, item, isLeaving: false });
          remaining.delete(entry.key);
        } else if (entry.isLeaving) {
          next.push(entry);
        } else if (!prefersReducedMotion) {
          next.push({ ...entry, isLeaving: true });
          const timeoutId = window.setTimeout(() => {
            setEntries((curr) => curr.filter((e) => e.key !== entry.key));
            timeoutsRef.current.delete(entry.key);
          }, exitMs);
          timeoutsRef.current.set(entry.key, timeoutId);
        }
      }

      for (const item of remaining.values()) {
        next.push({ key: getKey(item), item, isLeaving: false });
      }

      return next;
    });
  }, [items, getKey, exitMs, prefersReducedMotion]);

  useEffect(() => {
    const timeouts = timeoutsRef.current;
    return () => {
      timeouts.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  return entries;
}
