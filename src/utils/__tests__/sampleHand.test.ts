import { describe, expect, it } from 'vitest';
import { canDraw, handSize, libraryOf, newHand, shuffled, visibleCards } from '../sampleHand';
import type { Card } from '../../types/Card';

const card = (name: string, extra: Partial<Card> = {}) => ({ id: name, name, ...extra }) as Card;
const deck = (count: number) => Array.from({ length: count }, (_, index) => card(`c${index}`));

describe('sampleHand', () => {
  it('draws only from the main deck and leaves commanders out', () => {
    const cards = [
      card('main'),
      card('side', { zone: 'sideboard' }),
      card('maybe', { zone: 'maybeboard' }),
      card('commander', { isCommander: true })
    ];
    expect(libraryOf(cards).map((entry) => entry.name)).toEqual(['main']);
  });

  it('shuffles without losing or duplicating cards', () => {
    const items = [1, 2, 3, 4, 5];
    const result = shuffled(items, () => 0.5);
    expect([...result].sort()).toEqual(items);
    expect(items).toEqual([1, 2, 3, 4, 5]);
  });

  it('opens with seven cards and shows one fewer per mulligan', () => {
    const hand = newHand(deck(40));
    expect(visibleCards(hand)).toHaveLength(7);
    expect(handSize({ ...hand, mulligans: 2 })).toBe(5);
  });

  it('adds one card per draw and stops at the end of the library', () => {
    const hand = { ...newHand(deck(8)), drawn: 1 };
    expect(visibleCards(hand)).toHaveLength(8);
    expect(canDraw(hand)).toBe(false);
  });
});
