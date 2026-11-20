import { useCallback, useEffect, useState } from 'react';
import * as Scry from 'scryfall-sdk';
import { logger } from '../utils/logger';

export interface CardRuling {
  publishedAt: string;
  comment: string;
}

type RulingsState = { status: 'idle' | 'loading' } | { status: 'loaded'; rulings: CardRuling[] } | { status: 'error' };

/** Rulings belong to the oracle card, so one answer serves every printing of it. */
const cache = new Map<string, CardRuling[]>();

/** Test hook: the cache outlives a single render tree. */
export function clearRulingsCache() {
  cache.clear();
}

/**
 * Loads a card's rulings from Scryfall only once `enabled` turns on, so opening a card detail
 * costs no request until the reader asks for them.
 */
export function useCardRulings(cardId: string | undefined, oracleId: string | undefined, enabled: boolean) {
  const cacheKey = oracleId || cardId;
  const [state, setState] = useState<RulingsState>(() =>
    cacheKey && cache.has(cacheKey) ? { status: 'loaded', rulings: cache.get(cacheKey)! } : { status: 'idle' }
  );
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled || !cardId || !cacheKey) return undefined;
    const cached = cache.get(cacheKey);
    if (cached) {
      setState({ status: 'loaded', rulings: cached });
      return undefined;
    }

    let cancelled = false;
    setState({ status: 'loading' });
    Scry.Rulings.byId(cardId)
      .then((rulings) => {
        const mapped = rulings
          .map((ruling) => ({ publishedAt: ruling.published_at, comment: ruling.comment }))
          .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
        cache.set(cacheKey, mapped);
        if (!cancelled) setState({ status: 'loaded', rulings: mapped });
      })
      .catch((error: unknown) => {
        logger.error('Failed to load rulings:', error);
        if (!cancelled) setState({ status: 'error' });
      });

    return () => {
      cancelled = true;
    };
  }, [cardId, cacheKey, enabled, attempt]);

  const retry = useCallback(() => setAttempt((count) => count + 1), []);

  return { state, retry };
}
