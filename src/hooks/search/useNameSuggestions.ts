import { useEffect, useState } from 'react';
import * as Scry from 'scryfall-sdk';
import { logger } from '../../utils/logger';

const MIN_LENGTH = 2;
const DELAY_MS = 200;
const MAX_SUGGESTIONS = 8;

/** Scryfall syntax (`t:creature`, `cmc>=3`, quotes) is a query, not a name to complete. */
export const looksLikeSyntax = (query: string) => /[:=<>!"]/.test(query);

/**
 * Card names from Scryfall's autocomplete for what is typed, after a short pause. Stale
 * answers are dropped, and a failure just means no suggestions: the search still works.
 */
export function useNameSuggestions(query: string, enabled: boolean) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const trimmed = query.trim();
  const active = enabled && trimmed.length >= MIN_LENGTH && !looksLikeSyntax(trimmed);

  useEffect(() => {
    if (!active) {
      setSuggestions([]);
      return undefined;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      Scry.Cards.autoCompleteName(trimmed)
        .then((names) => {
          if (!cancelled) setSuggestions(names.slice(0, MAX_SUGGESTIONS));
        })
        .catch((error: unknown) => {
          logger.error('Card name autocomplete failed:', error);
          if (!cancelled) setSuggestions([]);
        });
    }, DELAY_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [trimmed, active]);

  return active ? suggestions : [];
}
