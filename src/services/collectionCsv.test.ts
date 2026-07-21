import { describe, expect, it } from 'vitest';
import { makeCard } from '../test/factories';
import { CollectionEntry } from '../types/Collection';
import { parseCollectionCsv, serializeCollectionCsv } from './collectionCsv';

const entry = (overrides: Partial<CollectionEntry> = {}): CollectionEntry => {
  const card = makeCard({ name: 'Sol Ring', set: 'c21', collector_number: '263', ...overrides.card });
  return {
    id: card.id,
    oracleId: card.oracle_id,
    name: card.name,
    set: card.set,
    rarity: card.rarity,
    quantity: 1,
    wishlist: false,
    card,
    updatedAt: '2026-07-20T00:00:00.000Z',
    ...overrides
  };
};

describe('serializeCollectionCsv', () => {
  it('writes a header and one row per owned/wishlisted entry', () => {
    const csv = serializeCollectionCsv([entry({ quantity: 2 })]);
    const lines = csv.split('\n');
    expect(lines[0]).toBe('Name,Set,Collector Number,Quantity,Wishlist,Scryfall ID');
    expect(lines[1]).toContain('Sol Ring');
    expect(lines[1]).toContain('c21');
    expect(lines[1]).toContain('263');
    expect(lines[1]).toContain('2');
  });

  it('quotes names containing commas', () => {
    const card = makeCard({ name: 'Kytheon, Hero of Akros', set: 'ori', collector_number: '23' });
    const csv = serializeCollectionCsv([entry({ card, name: card.name, quantity: 1 })]);
    expect(csv.split('\n')[1]).toContain('"Kytheon, Hero of Akros"');
  });

  it('skips entries with no copies and no wishlist flag', () => {
    const csv = serializeCollectionCsv([entry({ quantity: 0, wishlist: false })]);
    expect(csv.split('\n')).toHaveLength(1); // header only
  });
});

describe('parseCollectionCsv', () => {
  it('parses a well-formed file with header', () => {
    const csv = [
      'Name,Set,Collector Number,Quantity,Wishlist,Scryfall ID',
      'Sol Ring,c21,263,2,false,abc-123',
      'Mana Crypt,2xm,270,1,true,def-456'
    ].join('\n');
    const rows = parseCollectionCsv(csv);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({
      name: 'Sol Ring',
      set: 'c21',
      collectorNumber: '263',
      quantity: 2,
      wishlist: false,
      scryfallId: 'abc-123'
    });
    expect(rows[1].wishlist).toBe(true);
  });

  it('round-trips serialize -> parse', () => {
    const card = makeCard({ name: 'Kytheon, Hero of Akros', set: 'ori', collector_number: '23' });
    const csv = serializeCollectionCsv([entry({ card, name: card.name, quantity: 3, wishlist: true })]);
    const rows = parseCollectionCsv(csv);
    expect(rows[0].name).toBe('Kytheon, Hero of Akros');
    expect(rows[0].quantity).toBe(3);
    expect(rows[0].wishlist).toBe(true);
  });

  it('drops blank lines, nameless rows and empty rows', () => {
    const csv = ['Name,Set,Collector Number,Quantity,Wishlist', '', 'Sol Ring,c21,263,1,false', ',,,,'].join('\n');
    const rows = parseCollectionCsv(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe('Sol Ring');
  });

  it('tolerates a headerless file and missing trailing columns', () => {
    const rows = parseCollectionCsv('Sol Ring,c21,263,4');
    expect(rows).toHaveLength(1);
    expect(rows[0].quantity).toBe(4);
    expect(rows[0].wishlist).toBe(false);
    expect(rows[0].scryfallId).toBeUndefined();
  });
});
