import { CollectionCsvRow } from '../services/collectionCsv';

export interface QuickAddParse {
  rows: CollectionCsvRow[];
  /** Lines that are neither blank nor "set number", echoed back so nothing is dropped silently. */
  invalid: string[];
}

// Optional leading count ("4 mh3 123", "4x mh3 123"), set code, collector number (letters and
// a star are allowed: promos and variants), optional trailing count ("mh3 123 x4").
const LINE = /^(?:(\d+)\s*x?\s+)?([a-z0-9]{2,6})\s+(\d+[a-z★]*)(?:\s+x?(\d+)x?)?$/i;

/** Parses the quick-add box: one printing per line, by set code and collector number. */
export function parseQuickAdd(text: string): QuickAddParse {
  const rows: CollectionCsvRow[] = [];
  const invalid: string[] = [];
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    const match = LINE.exec(line);
    if (!match) {
      invalid.push(line);
      continue;
    }
    const [, leading, set, collectorNumber, trailing] = match;
    const quantity = Math.max(1, Number(leading ?? trailing ?? 1));
    rows.push({
      name: `${set.toUpperCase()} ${collectorNumber}`,
      set: set.toLowerCase(),
      collectorNumber,
      quantity,
      wishlist: false
    });
  }
  return { rows, invalid };
}
