import { describe, expect, it } from 'vitest';
import { parseQuickAdd } from '../quickAddParse';

describe('parseQuickAdd', () => {
  it('reads one printing per line by set code and collector number', () => {
    const { rows, invalid } = parseQuickAdd('mh3 123\nMKM 45a');
    expect(invalid).toEqual([]);
    expect(rows).toEqual([
      { name: 'MH3 123', set: 'mh3', collectorNumber: '123', quantity: 1, wishlist: false },
      { name: 'MKM 45a', set: 'mkm', collectorNumber: '45a', quantity: 1, wishlist: false }
    ]);
  });

  it('takes a count before or after the printing', () => {
    const quantities = parseQuickAdd('4 mh3 1\n3x mh3 2\nmh3 3 x2\nmh3 4 5').rows.map((row) => row.quantity);
    expect(quantities).toEqual([4, 3, 2, 5]);
  });

  it('skips blank lines and echoes lines it cannot read', () => {
    const { rows, invalid } = parseQuickAdd('\n  \nLightning Bolt\nmh3 7\n');
    expect(rows).toHaveLength(1);
    expect(invalid).toEqual(['Lightning Bolt']);
  });
});
