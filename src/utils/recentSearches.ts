import { STORAGE_KEYS } from '../constants/storage';

const MAX_RECENT = 6;

export function readRecentSearches(): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEYS.recentSearches) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((entry): entry is string => typeof entry === 'string') : [];
  } catch {
    return [];
  }
}

/** Most recent first, without duplicates (case-insensitive), capped. */
export function rememberSearch(query: string): string[] {
  const trimmed = query.trim();
  if (!trimmed) return readRecentSearches();
  const next = [
    trimmed,
    ...readRecentSearches().filter((entry) => entry.toLowerCase() !== trimmed.toLowerCase())
  ].slice(0, MAX_RECENT);
  try {
    localStorage.setItem(STORAGE_KEYS.recentSearches, JSON.stringify(next));
  } catch {
    // Private mode or quota: the list just does not persist.
  }
  return next;
}

export function clearRecentSearches() {
  try {
    localStorage.removeItem(STORAGE_KEYS.recentSearches);
  } catch {
    // Nothing to clear.
  }
}
