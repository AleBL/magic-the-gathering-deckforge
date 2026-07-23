import { describe, it, expect } from 'vitest';
import { Card } from '../types/Card';
import { deckToArenaText } from './deckText';

function card(overrides: Partial<Card>): Card {
  return { id: Math.random().toString(36).slice(2), name: 'Card', ...overrides } as Card;
}

describe('deckToArenaText', () => {
  it('aggregates copies and formats set + collector number', () => {
    const text = deckToArenaText([
      card({ name: 'Lightning Bolt', set: 'lea', collector_number: '161' }),
      card({ name: 'Lightning Bolt', set: 'lea', collector_number: '161' }),
      card({ name: 'Island' })
    ]);
    expect(text).toBe('2 Lightning Bolt (LEA) 161\n1 Island');
  });

  it('omits collector number when there is no set', () => {
    expect(deckToArenaText([card({ name: 'Forest' })])).toBe('1 Forest');
  });

  it('keeps different printings on separate lines', () => {
    const text = deckToArenaText([
      card({ name: 'Sol Ring', set: 'c21', collector_number: '263' }),
      card({ name: 'Sol Ring', set: 'ltc', collector_number: '297' })
    ]);
    expect(text).toBe('1 Sol Ring (C21) 263\n1 Sol Ring (LTC) 297');
  });
});
