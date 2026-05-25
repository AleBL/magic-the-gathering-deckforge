import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import CardGrid from './CardGrid';
import CardSizeSelector from './CardSizeSelector';
import SearchFilters from './SearchFilters';
import { Card } from '../types/Card';
import { CardSize } from '../types';
import { useCardSearch } from '../hooks/useCardSearch';

interface CardSearchProps {
  onAddToDeck: (card: Card) => void;
}

function CardSearch({ onAddToDeck }: CardSearchProps) {
  const { i18n, t } = useTranslation();
  const [cardSize, setCardSize] = useState<CardSize>('medium');

  const {
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
  } = useCardSearch(i18n.language || 'en');

  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadNextPage();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [loadNextPage]);

  return (
    <div className="workspace-container">
      <div className="workspace-header">
        <div className="toolbar-row">
          <input
            id="search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="form-input flex-1"
          />
          <button onClick={() => loadFirstPage(buildQuery(searchQuery))} className="primary-button px-6">
            {t('searchButton')}
          </button>
        </div>

        <SearchFilters filters={filters} setFilters={setFilters} />

        <div className="toolbar-row">
          <CardSizeSelector selectedSize={cardSize} onSizeChange={setCardSize} />
        </div>
      </div>

      <div className="workspace-body p-4">
        {isLoadingInitial && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-4">
            {Array.from({ length: 21 }).map((_, i) => (
              <div key={i} className="placeholder-pulse" style={{ aspectRatio: '2.5/3.5' }} />
            ))}
          </div>
        )}

        {error && (
          <div className="center-container">
            <div className="error-text">{t(error as string)}</div>
          </div>
        )}

        {!isLoadingInitial && !error && cards.length === 0 && (
          <div className="center-container">
            <div className="empty-state-text">{t('noResults')}</div>
          </div>
        )}

        {!isLoadingInitial && !error && cards.length > 0 && (
          <CardGrid cards={cards} size={cardSize} onAddToDeck={onAddToDeck} />
        )}

        {!isLoadingInitial && hasMore && (
          <div ref={sentinelRef} className="h-8 flex items-center justify-center mt-4">
            {isLoadingMore && <div className="loading-spinner" />}
          </div>
        )}
      </div>
    </div>
  );
}

export default CardSearch;
