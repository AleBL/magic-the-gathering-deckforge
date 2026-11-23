import { beforeEach, describe, expect, it } from 'vitest';
import { clearRecentSearches, readRecentSearches, rememberSearch } from '../recentSearches';
import { looksLikeSyntax } from '../../hooks/search/useNameSuggestions';

describe('recentSearches', () => {
  beforeEach(() => localStorage.clear());

  it('keeps the newest first without duplicates, ignoring case', () => {
    rememberSearch('bolt');
    rememberSearch('Goblin');
    rememberSearch('BOLT');
    expect(readRecentSearches()).toEqual(['BOLT', 'Goblin']);
  });

  it('keeps at most six and ignores blanks', () => {
    for (let index = 0; index < 8; index += 1) rememberSearch(`query ${index}`);
    rememberSearch('   ');
    expect(readRecentSearches()).toHaveLength(6);
    expect(readRecentSearches()[0]).toBe('query 7');
  });

  it('clears the list', () => {
    rememberSearch('bolt');
    clearRecentSearches();
    expect(readRecentSearches()).toEqual([]);
  });
});

describe('looksLikeSyntax', () => {
  it('leaves Scryfall syntax to the search instead of completing it', () => {
    expect(looksLikeSyntax('t:creature')).toBe(true);
    expect(looksLikeSyntax('cmc>=3')).toBe(true);
    expect(looksLikeSyntax('lightning bo')).toBe(false);
  });
});
