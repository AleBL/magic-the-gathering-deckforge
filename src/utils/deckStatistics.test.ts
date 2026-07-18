import { describe, expect, it } from 'vitest';
import { computeDeckStatistics } from './deckStatistics';
import { makeCard } from '../test/factories';
import { Card } from '../types/Card';

/** A non-land spell with the given mana cost. */
const spell = (mana_cost: string, overrides: Partial<Card> = {}): Card =>
  makeCard({
    type_line: 'Creature — Test',
    mana_cost,
    colors: [],
    color_identity: [],
    ...overrides
  });

const basicLand = (name: string, overrides: Partial<Card> = {}): Card =>
  makeCard({
    name,
    printed_name: name,
    type_line: `Basic Land — ${name}`,
    mana_cost: '',
    cmc: 0,
    colors: [],
    color_identity: [],
    ...overrides
  });

const spells = (n: number, mana_cost: string, overrides: Partial<Card> = {}): Card[] =>
  Array.from({ length: n }, (_, i) => spell(mana_cost, { name: `Spell ${mana_cost} ${i}`, ...overrides }));

describe('computeDeckStatistics — colorless ({C}) and Wastes support', () => {
  it('counts {C} pips in manaColorSymbolCounts.C', () => {
    const deck = [spell('{2}{C}'), spell('{C}{C}{R}')];
    const stats = computeDeckStatistics(deck);
    expect(stats.manaColorSymbolCounts.C).toBe(3);
    expect(stats.manaColorSymbolCounts.R).toBe(1);
  });

  it('does not count generic numeric costs or snow mana as colorless pips', () => {
    const deck = [spell('{2}{R}'), spell('{X}{S}{G}')];
    const stats = computeDeckStatistics(deck);
    expect(stats.manaColorSymbolCounts.C).toBe(0);
  });

  it('treats Wastes as a basic land when counting the existing mana base', () => {
    // 6 spells → target lands = floor(6 * 2/3) = 4; 4 Wastes already fully cover it.
    const deck = [
      ...spells(6, '{2}{C}'),
      ...Array.from({ length: 4 }, (_, i) => basicLand('Wastes', { id: `wastes-${i}` }))
    ];
    const stats = computeDeckStatistics(deck);
    expect(stats.neededBasicLands).toBe(0);
  });

  it('counts Wastes as a colorless mana source in landColorCounts.C', () => {
    const deck = [spell('{C}'), basicLand('Wastes')];
    const stats = computeDeckStatistics(deck);
    expect(stats.landColorCounts.C).toBe(1);
  });

  it('counts non-basic lands that only add {C} as colorless sources', () => {
    const deck = [
      spell('{C}'),
      makeCard({
        name: 'Crystal Vein',
        type_line: 'Land',
        mana_cost: '',
        colors: [],
        color_identity: [],
        oracle_text: '{T}: Add {C}.'
      })
    ];
    const stats = computeDeckStatistics(deck);
    expect(stats.landColorCounts.C).toBe(1);
  });

  it('suggests Wastes for decks whose spells require {C}', () => {
    const deck = spells(9, '{1}{C}');
    const stats = computeDeckStatistics(deck);
    expect(stats.suggestedBasicLandCounts.Wastes).toBeGreaterThan(0);
  });

  it('splits suggestions between Wastes and colored basics when {C} and colored pips coexist', () => {
    const deck = [...spells(6, '{C}{C}'), ...spells(6, '{R}{R}')];
    const stats = computeDeckStatistics(deck);
    expect(stats.suggestedBasicLandCounts.Wastes).toBeGreaterThan(0);
    expect(stats.suggestedBasicLandCounts.Mountain).toBeGreaterThan(0);
  });
});

describe('computeDeckStatistics — mana base optimizer floors and rounding', () => {
  it('recommends at least one red source for a deck with a single red card and no lands', () => {
    const deck = [spell('{R}', { name: 'Lone Bolt' })];
    const stats = computeDeckStatistics(deck);
    expect(stats.suggestedBasicLandCounts.Mountain).toBeGreaterThanOrEqual(1);
    expect(stats.neededBasicLands).toBeGreaterThanOrEqual(1);
  });

  it('never allocates zero sources to a color that appears in the deck (minimum floor)', () => {
    // 19 W pips vs a single G pip: proportional rounding alone would give G zero.
    const deck = [...spells(19, '{W}'), spell('{G}', { name: 'Lone Elf' })];
    const stats = computeDeckStatistics(deck);
    expect(stats.suggestedBasicLandCounts.Forest).toBeGreaterThanOrEqual(1);
    expect(stats.suggestedBasicLandCounts.Plains).toBeGreaterThanOrEqual(1);
  });

  it('allocates exactly neededBasicLands lands in total', () => {
    const deck = [...spells(10, '{W}{U}'), ...spells(5, '{B}'), ...spells(3, '{R}'), spell('{G}')];
    const stats = computeDeckStatistics(deck);
    const totalSuggested = Object.values(stats.suggestedBasicLandCounts).reduce((a, b) => a + b, 0);
    expect(totalSuggested).toBe(stats.neededBasicLands);
  });

  it('keeps allocations proportional: the dominant color receives the most lands', () => {
    const deck = [...spells(12, '{R}{R}'), ...spells(3, '{U}')];
    const stats = computeDeckStatistics(deck);
    expect(stats.suggestedBasicLandCounts.Mountain).toBeGreaterThan(stats.suggestedBasicLandCounts.Island);
    expect(stats.suggestedBasicLandCounts.Island).toBeGreaterThanOrEqual(1);
  });

  it('handles more colors than land slots by covering the most-demanded colors first', () => {
    // 2 spells → tiny target; five colors present. Sum must still match neededBasicLands
    // and no allocation may be negative.
    const deck = [spell('{W}{U}{B}{R}{G}'), spell('{R}{R}{R}')];
    const stats = computeDeckStatistics(deck);
    const counts = Object.values(stats.suggestedBasicLandCounts);
    expect(counts.every((c) => c >= 0)).toBe(true);
    expect(counts.reduce((a, b) => a + b, 0)).toBe(stats.neededBasicLands);
    if (stats.neededBasicLands > 0) {
      expect(stats.suggestedBasicLandCounts.Mountain).toBeGreaterThanOrEqual(1);
    }
  });

  it('counts artifact/creature lands in totalLands (unlike the type breakdown)', () => {
    const deck = [
      spell('{R}'),
      makeCard({
        name: 'Darksteel Citadel',
        type_line: 'Artifact Land',
        mana_cost: '',
        colors: [],
        color_identity: []
      }),
      basicLand('Wastes')
    ];
    const stats = computeDeckStatistics(deck);
    expect(stats.totalLands).toBe(2);
  });

  it('returns all-zero suggestions for an empty deck without NaN or negatives', () => {
    const stats = computeDeckStatistics([]);
    expect(stats.neededBasicLands).toBe(0);
    expect(stats.targetTotalLands).toBe(0);
    Object.values(stats.suggestedBasicLandCounts).forEach((count) => {
      expect(Number.isFinite(count)).toBe(true);
      expect(count).toBe(0);
    });
  });

  it('suggests nothing when the existing mana base already meets the target', () => {
    const deck = [
      ...spells(6, '{R}'),
      ...Array.from({ length: 10 }, (_, i) => basicLand('Mountain', { id: `mtn-${i}` }))
    ];
    const stats = computeDeckStatistics(deck);
    expect(stats.neededBasicLands).toBe(0);
    const totalSuggested = Object.values(stats.suggestedBasicLandCounts).reduce((a, b) => a + b, 0);
    expect(totalSuggested).toBe(0);
  });

  it('still fills the whole remaining land budget when only one color is present', () => {
    const deck = spells(30, '{R}{R}');
    const stats = computeDeckStatistics(deck);
    expect(stats.suggestedBasicLandCounts.Mountain).toBe(stats.neededBasicLands);
    expect(stats.neededBasicLands).toBe(20);
  });
});
