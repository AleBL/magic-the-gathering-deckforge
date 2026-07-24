import { describe, it, expect } from 'vitest';
import { buildDecklistLines } from './deckImage';
import { Card } from '../types/Card';

const c = (name: string): Card => ({ name }) as Card;

describe('buildDecklistLines', () => {
  it('groups copies by name and counts them', () => {
    const lines = buildDecklistLines([c('Bolt'), c('Bolt'), c('Forest')]);
    expect(lines).toEqual([
      { name: 'Bolt', count: 2 },
      { name: 'Forest', count: 1 }
    ]);
  });

  it('sorts lines alphabetically by name', () => {
    const lines = buildDecklistLines([c('Zoo'), c('Ape')]);
    expect(lines.map((l) => l.name)).toEqual(['Ape', 'Zoo']);
  });

  it('returns an empty list for no cards', () => {
    expect(buildDecklistLines([])).toEqual([]);
  });
});
