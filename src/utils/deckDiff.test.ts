import { describe, it, expect } from 'vitest';
import { diffDecks } from './deckDiff';
import { Card } from '../types/Card';

// Minimal card factory — diffDecks only reads `name`.
const c = (name: string): Card => ({ name }) as Card;

describe('diffDecks', () => {
  it('reports cards unique to each deck', () => {
    const diff = diffDecks([c('Bolt'), c('Forest')], [c('Bolt'), c('Island')]);
    expect(diff.onlyInA.map((e) => e.name)).toEqual(['Forest']);
    expect(diff.onlyInB.map((e) => e.name)).toEqual(['Island']);
    expect(diff.changed).toEqual([]);
  });

  it('reports copy-count changes for shared cards', () => {
    const diff = diffDecks([c('Bolt'), c('Bolt'), c('Bolt')], [c('Bolt')]);
    expect(diff.changed).toEqual([expect.objectContaining({ name: 'Bolt', countA: 3, countB: 1 })]);
    expect(diff.onlyInA).toEqual([]);
    expect(diff.onlyInB).toEqual([]);
  });

  it('omits cards with identical counts', () => {
    const diff = diffDecks([c('Bolt'), c('Bolt')], [c('Bolt'), c('Bolt')]);
    expect(diff.onlyInA).toEqual([]);
    expect(diff.onlyInB).toEqual([]);
    expect(diff.changed).toEqual([]);
  });

  it('sorts each bucket by name', () => {
    const diff = diffDecks([c('Zoo'), c('Ape')], []);
    expect(diff.onlyInA.map((e) => e.name)).toEqual(['Ape', 'Zoo']);
  });
});
