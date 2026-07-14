import { Card } from '../types/Card';

let cardSeq = 0;

/**
 * Builds a minimal, valid {@link Card} for tests. Every call gets a unique id/name
 * unless overridden, so cards are distinguishable without callers wiring boilerplate.
 * Only fields the code under test actually reads are populated by default.
 */
export function makeCard(overrides: Partial<Card> = {}): Card {
  cardSeq += 1;
  const base: Card = {
    id: `card-${cardSeq}`,
    oracle_id: `oracle-${cardSeq}`,
    name: `Test Card ${cardSeq}`,
    printed_name: `Test Card ${cardSeq}`,
    type_line: 'Creature — Human',
    set_name: 'Test Set',
    rarity: 'common',
    cmc: 1,
    colors: ['W'],
    color_identity: ['W']
  };

  return { ...base, ...overrides };
}
