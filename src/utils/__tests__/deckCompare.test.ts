import { describe, expect, it } from 'vitest';
import { compareDecks } from '../deckCompare';
import type { Card } from '../../types/Card';

const copies = (name: string, count: number, extra: Partial<Card> = {}) =>
  Array.from({ length: count }, (_, index) => ({ id: `${name}-${index}`, name, ...extra }) as Card);

describe('compareDecks', () => {
  it('splits cards into one-sided, different counts and shared', () => {
    const left = [...copies('Lightning Bolt', 4), ...copies('Goblin Guide', 4), ...copies('Mountain', 20)];
    const right = [...copies('Lightning Bolt', 4), ...copies('Goblin Guide', 2), ...copies('Lava Spike', 4)];

    const result = compareDecks(left, right);
    expect(result.onlyLeft).toEqual([{ name: 'Mountain', count: 20 }]);
    expect(result.onlyRight).toEqual([{ name: 'Lava Spike', count: 4 }]);
    expect(result.different).toEqual([{ name: 'Goblin Guide', left: 4, right: 2 }]);
    expect(result.shared).toBe(1);
  });

  it('compares main decks only', () => {
    const left = [...copies('Skullcrack', 3, { zone: 'sideboard' })];
    const right: Card[] = [];
    expect(compareDecks(left, right).onlyLeft).toEqual([]);
  });

  it('reports identical decks as fully shared', () => {
    const deck = [...copies('Lightning Bolt', 4)];
    expect(compareDecks(deck, deck)).toEqual({ onlyLeft: [], onlyRight: [], different: [], shared: 1 });
  });
});
