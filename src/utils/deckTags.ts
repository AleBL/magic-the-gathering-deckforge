import { Deck } from '../types/Deck';

export const MAX_TAGS = 8;
const MAX_TAG_LENGTH = 24;

/**
 * Cleans what the user typed: comma separated, trimmed, collapsed spaces, no duplicates
 * (case-insensitive, first spelling wins), capped in count and length.
 */
export function normalizeTags(input: string | string[]): string[] {
  const parts = Array.isArray(input) ? input : input.split(',');
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const raw of parts) {
    const tag = raw.replace(/\s+/g, ' ').trim().slice(0, MAX_TAG_LENGTH);
    const key = tag.toLowerCase();
    if (!tag || seen.has(key)) continue;
    seen.add(key);
    tags.push(tag);
    if (tags.length === MAX_TAGS) break;
  }
  return tags;
}

/** Every tag in use across the library, most used first, then alphabetical. */
export function tagsInUse(decks: Deck[]): string[] {
  const counts = new Map<string, { label: string; count: number }>();
  for (const deck of decks) {
    for (const tag of deck.tags ?? []) {
      const key = tag.toLowerCase();
      const entry = counts.get(key);
      if (entry) entry.count += 1;
      else counts.set(key, { label: tag, count: 1 });
    }
  }
  return [...counts.values()]
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .map((entry) => entry.label);
}

export const hasTag = (deck: Deck, tag: string) =>
  (deck.tags ?? []).some((own) => own.toLowerCase() === tag.toLowerCase());
