import { Card } from '../types/Card';

export interface DeckDiffEntry {
  name: string;
  countA: number;
  countB: number;
  /** A representative printing of this card, for image/display. */
  card: Card;
}

export interface DeckDiff {
  /** Cards present in A but absent in B. */
  onlyInA: DeckDiffEntry[];
  /** Cards present in B but absent in A. */
  onlyInB: DeckDiffEntry[];
  /** Cards in both decks with a different copy count. */
  changed: DeckDiffEntry[];
}

function countByName(cards: Card[]): Map<string, { count: number; card: Card }> {
  const map = new Map<string, { count: number; card: Card }>();
  for (const card of cards) {
    const existing = map.get(card.name);
    if (existing) existing.count += 1;
    else map.set(card.name, { count: 1, card });
  }
  return map;
}

/**
 * Compare two decks by logical card name (ignoring printing). Reports cards
 * unique to each side and cards whose copy count changed. Unchanged cards are
 * omitted. Copies are counted from the flat card arrays (one entry per copy).
 */
export function diffDecks(cardsA: Card[], cardsB: Card[]): DeckDiff {
  const a = countByName(cardsA);
  const b = countByName(cardsB);

  const onlyInA: DeckDiffEntry[] = [];
  const onlyInB: DeckDiffEntry[] = [];
  const changed: DeckDiffEntry[] = [];

  for (const name of new Set([...a.keys(), ...b.keys()])) {
    const ea = a.get(name);
    const eb = b.get(name);
    const countA = ea?.count ?? 0;
    const countB = eb?.count ?? 0;
    const entry: DeckDiffEntry = { name, countA, countB, card: (ea ?? eb)!.card };

    if (countB === 0) onlyInA.push(entry);
    else if (countA === 0) onlyInB.push(entry);
    else if (countA !== countB) changed.push(entry);
  }

  const byName = (x: DeckDiffEntry, y: DeckDiffEntry) => x.name.localeCompare(y.name);
  return { onlyInA: onlyInA.sort(byName), onlyInB: onlyInB.sort(byName), changed: changed.sort(byName) };
}
