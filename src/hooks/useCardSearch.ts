import { useState, useEffect, useRef, useCallback } from 'react';
import * as Scry from 'scryfall-sdk';
import MagicEmitter from 'scryfall-sdk/out/util/MagicEmitter';
import { Card } from '../types/Card';
import { SearchFilters, EMPTY_SEARCH_FILTERS } from '../types';

const DEFAULT_QUERY = 'c>=1';
const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 500;

export function useCardSearch(language: string) {
  const [searchQuery, setSearchQuery] = useState('');
  const [cards, setCards] = useState<Card[]>([]);
  const [isLoadingInitial, setIsLoadingInitial] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<SearchFilters>(EMPTY_SEARCH_FILTERS);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [activeQuery, setActiveQuery] = useState('');

  const isLoadingMoreRef = useRef(false);
  const isInitialMount = useRef(true);
  const activeEmittersRef = useRef<MagicEmitter<any>[]>([]);
  const latestSearchIdRef = useRef<number>(0);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSearchedQueryRef = useRef(searchQuery);
  const lastSearchedFiltersRef = useRef(filters);

  const buildQuery = useCallback(
    (raw: string) => {
      const hasFilters = filters.colors.length > 0 || filters.types.length > 0 || filters.rarity || filters.cmc;
      const trimmed = raw.trim();
      let query = '';

      if (trimmed) {
        query = trimmed;
      } else if (!hasFilters) {
        query = DEFAULT_QUERY;
      }

      if (filters.colors.length > 0) {
        query += `${query ? ' ' : ''}c:${filters.colors.join('')}`;
      }
      if (filters.types.length > 0) {
        query += `${query ? ' ' : ''}t:${filters.types.join(' ')}`;
      }
      if (filters.rarity) {
        query += `${query ? ' ' : ''}r:${filters.rarity}`;
      }
      if (filters.cmc) {
        query += `${query ? ' ' : ''}cmc=${filters.cmc}`;
      }

      return query;
    },
    [filters]
  );

  const searchCards = useCallback(
    async (baseQuery: string, page: number, searchLanguage: string): Promise<{ cards: Card[]; hasMore: boolean }> => {
      const results: Card[] = [];
      const query = `${baseQuery} lang:${searchLanguage}`;

      return new Promise((resolve, reject) => {
        const emitter = Scry.Cards.search(query, { page });
        activeEmittersRef.current.push(emitter);

        const cleanup = () => {
          activeEmittersRef.current = activeEmittersRef.current.filter((e) => e !== emitter);
        };

        emitter.cancelAfterPage();

        emitter.on('data', (card: Scry.Card) => {
          const multiverseId = card.multiverse_ids?.[0];
          const gathererUrl = multiverseId
            ? `https://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=${multiverseId}&type=card`
            : '';

          results.push({
            ...(card as unknown as Card),
            image_uris: card.image_uris
              ? {
                  ...card.image_uris,
                  gatherer: gathererUrl
                }
              : undefined
          });
        });

        emitter.on('done', () => {
          cleanup();
          resolve({ cards: results, hasMore: emitter.cancelled });
        });

        emitter.on('cancel', () => {
          cleanup();
          resolve({ cards: results, hasMore: true });
        });

        emitter.on('not_found', () => {
          cleanup();
          resolve({ cards: [], hasMore: false });
        });

        emitter.on('error', (err: Error & { status?: number }) => {
          cleanup();
          if (err?.status === 404 || err?.message?.includes('404')) {
            resolve({ cards: [], hasMore: false });
          } else {
            reject(err);
          }
        });
      });
    },
    []
  );

  const fetchPage = useCallback(
    async (query: string, page: number): Promise<{ cards: Card[]; hasMore: boolean }> => {
      const preferredLang = language || 'en';

      const [preferredResult, englishResult] = await Promise.all([
        searchCards(query, page, preferredLang),
        preferredLang !== 'en' ? searchCards(query, page, 'en') : Promise.resolve({ cards: [], hasMore: false })
      ]);

      const seen = new Set(preferredResult.cards.map((card) => card.oracle_id));
      const merged = [...preferredResult.cards, ...englishResult.cards.filter((card) => !seen.has(card.oracle_id))];
      const hasMoreResults = preferredResult.hasMore || englishResult.hasMore;

      return { cards: merged, hasMore: hasMoreResults };
    },
    [language, searchCards]
  );

  const loadFirstPage = useCallback(
    async (query: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }

      lastSearchedQueryRef.current = searchQuery;
      lastSearchedFiltersRef.current = filters;

      latestSearchIdRef.current += 1;
      const searchId = latestSearchIdRef.current;

      activeEmittersRef.current.forEach((emitter) => {
        if (emitter) {
          emitter.cancel();
        }
      });
      activeEmittersRef.current = [];

      setIsLoadingInitial(true);
      setError(null);
      setCards([]);
      setCurrentPage(1);
      setHasMore(true);
      setActiveQuery(query);

      isLoadingMoreRef.current = false;
      setIsLoadingMore(false);

      try {
        const { cards: results, hasMore: more } = await fetchPage(query, 1);
        if (searchId !== latestSearchIdRef.current) return;

        setCards(results);
        setHasMore(more);
        setCurrentPage(2);
      } catch (e) {
        if (searchId !== latestSearchIdRef.current) return;
        setError('error');
      } finally {
        if (searchId === latestSearchIdRef.current) {
          setIsLoadingInitial(false);
        }
      }
    },
    [fetchPage, searchQuery, filters]
  );

  const loadNextPage = useCallback(async () => {
    if (isLoadingMoreRef.current || !hasMore || !activeQuery) return;
    isLoadingMoreRef.current = true;
    setIsLoadingMore(true);
    const searchId = latestSearchIdRef.current;
    try {
      const { cards: results, hasMore: more } = await fetchPage(activeQuery, currentPage);
      if (searchId !== latestSearchIdRef.current) return;

      if (results.length === 0) {
        setHasMore(false);
      } else {
        setCards((prev) => [...prev, ...results]);
        setHasMore(more);
        setCurrentPage((p) => p + 1);
      }
    } catch (e) {
      if (searchId !== latestSearchIdRef.current) return;
      console.error('Load more failed:', e);
      setHasMore(false);
    } finally {
      if (searchId === latestSearchIdRef.current) {
        setIsLoadingMore(false);
        isLoadingMoreRef.current = false;
      }
    }
  }, [activeQuery, currentPage, fetchPage, hasMore]);

  // Initial search on mount
  useEffect(() => {
    loadFirstPage(buildQuery(''));
  }, []);

  // Debounced search on query/filters change
  useEffect(() => {
    const raw = searchQuery.trim();
    const queryChanged = searchQuery !== lastSearchedQueryRef.current;
    const filtersChanged = JSON.stringify(filters) !== JSON.stringify(lastSearchedFiltersRef.current);

    if (isInitialMount.current) {
      isInitialMount.current = false;
      return undefined;
    }

    if (!queryChanged && !filtersChanged) {
      return undefined;
    }

    if (raw.length > 0 && raw.length < MIN_QUERY_LENGTH) return undefined;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      loadFirstPage(buildQuery(searchQuery));
    }, DEBOUNCE_MS);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery, filters, loadFirstPage, buildQuery]);

  // Cleanup active emitters on unmount
  useEffect(() => {
    return () => {
      activeEmittersRef.current.forEach((emitter) => {
        if (emitter) {
          emitter.cancel();
        }
      });
    };
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    cards,
    isLoadingInitial,
    isLoadingMore,
    error,
    filters,
    setFilters,
    hasMore,
    loadFirstPage,
    loadNextPage,
    buildQuery
  };
}
