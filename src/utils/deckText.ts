import { Card } from '../types/Card';

/**
 * Serializes a deck's cards to the plain-text list format shared by MTG Arena
 * and MTGO importers: `<count> <name> (<SET>) <collector_number>`, one line per
 * distinct printing. Set/collector data is included only when present so the
 * output stays valid for cards imported without an exact printing.
 */
export function deckToArenaText(cards: Card[]): string {
  const counts = new Map<string, { count: number; card: Card }>();
  for (const card of cards) {
    const key = `${card.name}|${card.set ?? ''}|${card.collector_number ?? ''}`;
    const existing = counts.get(key);
    if (existing) existing.count += 1;
    else counts.set(key, { count: 1, card });
  }

  return Array.from(counts.values())
    .map(({ count, card }) => {
      const setCode = card.set ? ` (${card.set.toUpperCase()})` : '';
      const collector = card.set && card.collector_number ? ` ${card.collector_number}` : '';
      return `${count} ${card.name}${setCode}${collector}`;
    })
    .join('\n');
}
