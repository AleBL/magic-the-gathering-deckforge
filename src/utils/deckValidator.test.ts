import { describe, expect, it } from 'vitest';
import { validateDeck } from './deckValidator';
import { DeckFormatType } from '../types/enums';
import { makeCard } from '../test/factories';
import { Card } from '../types/Card';

const copies = (n: number, overrides: Partial<Card> = {}): Card[] =>
  Array.from({ length: n }, () => makeCard(overrides));

// Distinct-named cards, so the only rule under test is the one being asserted
// (not an accidental 4-copy violation from repeated filler names).
const uniqueCards = (n: number, overrides: Partial<Card> = {}): Card[] =>
  Array.from({ length: n }, (_, i) => makeCard({ ...overrides, name: `Unique ${i}` }));

const errorKeys = (cards: Card[], format: Parameters<typeof validateDeck>[1]) =>
  validateDeck(cards, format).errors.map((e) => e.key);

describe('validateDeck', () => {
  it('flags an empty deck as invalid', () => {
    const result = validateDeck([], DeckFormatType.STANDARD);
    expect(result.isValid).toBe(false);
    expect(result.errors.map((e) => e.key)).toEqual(['validationEmptyDeck']);
  });

  it('treats any non-empty freeform deck as valid', () => {
    const result = validateDeck(copies(3), DeckFormatType.FREEFORM);
    expect(result).toEqual({ isValid: true, errors: [] });
  });

  it('requires the minimum deck size for constructed formats', () => {
    const keys = errorKeys(copies(10, { name: 'Distinct', rarity: 'common' }), DeckFormatType.STANDARD);
    expect(keys).toContain('validationMinCards');
  });

  it('rejects more than four copies of a non-basic card in Standard', () => {
    const deck = [...copies(5, { name: 'Lightning Bolt' }), ...copies(55, { name: 'Filler' })];
    const errors = validateDeck(deck, DeckFormatType.STANDARD).errors;
    const maxCopies = errors.find((e) => e.key === 'validationMaxCopies');
    expect(maxCopies?.params).toMatchObject({ name: 'Lightning Bolt', count: 5, max: 4 });
  });

  it('exempts basic lands from the four-copy limit', () => {
    const deck = [
      ...copies(20, { name: 'Mountain', type_line: 'Basic Land — Mountain' }),
      ...uniqueCards(40, { rarity: 'common' })
    ];
    const keys = errorKeys(deck, DeckFormatType.STANDARD);
    expect(keys).not.toContain('validationMaxCopies');
  });

  it('requires exactly 100 cards for Commander', () => {
    const commander = makeCard({ name: 'Cmd', isCommander: true });
    const keys = errorKeys([commander, ...copies(50, { name: 'X' })], DeckFormatType.COMMANDER);
    expect(keys).toContain('validationCommanderExactCards');
  });

  it('enforces the Commander singleton rule for non-basic cards', () => {
    const commander = makeCard({ name: 'Cmd', isCommander: true });
    const distinctDeck = [commander, ...copies(2, { name: 'Sol Ring' })];
    const singleton = validateDeck(distinctDeck, DeckFormatType.COMMANDER).errors.find(
      (e) => e.key === 'validationCommanderSingleton'
    );
    expect(singleton?.params).toMatchObject({ name: 'Sol Ring', count: 2 });
  });

  it('reports a missing Commander', () => {
    const keys = errorKeys(copies(100, { name: 'Filler' }), DeckFormatType.COMMANDER);
    expect(keys).toContain('validationCommanderNoCommander');
  });

  it('flags non-common cards in Pauper', () => {
    const deck = [makeCard({ name: 'Fancy', rarity: 'rare' }), ...copies(59, { name: 'Cheap', rarity: 'common' })];
    const pauper = validateDeck(deck, DeckFormatType.PAUPER).errors.find((e) => e.key === 'validationPauperCommonsOnly');
    expect(pauper?.params).toMatchObject({ list: 'Fancy' });
  });

  it('flags cards banned in the selected format via Scryfall legalities', () => {
    const banned = makeCard({
      name: 'Banned Card',
      rarity: 'common',
      legalities: {
        standard: 'banned',
        modern: 'legal',
        legacy: 'legal',
        commander: 'legal',
        pauper: 'legal',
        vintage: 'legal',
        pioneer: 'legal'
      }
    });
    const deck = [banned, ...copies(59, { name: 'Filler', rarity: 'common' })];
    const banlist = validateDeck(deck, DeckFormatType.STANDARD).errors.find((e) => e.key === 'validationBanlist');
    expect(banlist?.params).toMatchObject({ format: 'standard', list: 'Banned Card' });
  });
});
