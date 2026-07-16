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

  // Read getKey/exitMs through refs so callers can pass inline callbacks
  // without retriggering the sync effect every render — an inline getKey
  // used to re-run the effect after its own setEntries, looping forever
  // ("Maximum update depth exceeded").
  const getKeyRef = useRef(getKey);
  getKeyRef.current = getKey;
  const exitMsRef = useRef(exitMs);
  exitMsRef.current = exitMs;

  useEffect(() => {
    const remaining = new Map(items.map((item) => [getKeyRef.current(item), item]));

    setEntries((current) => {
      const next: AnimatedEntry<T>[] = [];
      let changed = false;

      for (const entry of current) {
        const item = remaining.get(entry.key);
        if (item !== undefined) {
          if (item === entry.item && !entry.isLeaving) {
            next.push(entry);
          } else {
            next.push({ key: entry.key, item, isLeaving: false });
            changed = true;
          }
          remaining.delete(entry.key);
        } else if (entry.isLeaving) {
          next.push(entry);
        } else if (!prefersReducedMotion) {
          next.push({ ...entry, isLeaving: true });
          changed = true;
          const timeoutId = window.setTimeout(() => {
            setEntries((curr) => curr.filter((e) => e.key !== entry.key));
            timeoutsRef.current.delete(entry.key);
          }, exitMsRef.current);
          timeoutsRef.current.set(entry.key, timeoutId);
        } else {
          // Reduced motion: dropped immediately (not pushed to next).
          changed = true;
        }
      }

      for (const item of remaining.values()) {
        next.push({ key: getKeyRef.current(item), item, isLeaving: false });
        changed = true;
      }

      // Bail out with the same reference when nothing changed so React
      // skips the re-render — items is often a fresh array each render.
      return changed ? next : current;
    });
  }, [items, prefersReducedMotion]);

  useEffect(() => {
    const timeouts = timeoutsRef.current;
    return () => {
      timeouts.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  return entries;
}
