import { describe, expect, it } from 'vitest';
import { hasTag, MAX_TAGS, normalizeTags, tagsInUse } from '../deckTags';
import type { Deck } from '../../types/Deck';

const deck = (tags?: string[]) =>
  ({ id: Math.random().toString(), name: 'Deck', cards: [], format: 'modern', createdAt: '', tags }) as Deck;

describe('deckTags', () => {
  it('splits, trims and dedupes what was typed, keeping the first spelling', () => {
    expect(normalizeTags(' Aggro,  budget  , aggro,, Red   deck ')).toEqual(['Aggro', 'budget', 'Red deck']);
  });

  it('caps how many tags a deck keeps', () => {
    const many = Array.from({ length: 12 }, (_, index) => `tag ${index}`);
    expect(normalizeTags(many)).toHaveLength(MAX_TAGS);
  });

  it('lists the tags in use, most used first', () => {
    expect(tagsInUse([deck(['Budget', 'Aggro']), deck(['aggro']), deck()])).toEqual(['Aggro', 'Budget']);
  });

  it('matches tags without regard to case', () => {
    expect(hasTag(deck(['Budget']), 'budget')).toBe(true);
    expect(hasTag(deck(), 'budget')).toBe(false);
  });
});
