import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FaSpinner, FaPalette, FaInfoCircle } from 'react-icons/fa';
import { Card } from '../../types/Card';
import { DeckRelatedToken } from '../../types/Deck';
import { useCardRelatedTokens, RelatedToken } from '../../hooks/useCardRelatedTokens';

interface DeckTokensTabProps {
  cards: Card[];
  cachedTokens?: DeckRelatedToken[];
  onTokensLoaded?: (tokens: RelatedToken[]) => void;
  onTokenClick?: (token: Card) => void;
}

function DeckTokensTab({ cards, cachedTokens, onTokensLoaded, onTokenClick }: DeckTokensTabProps) {
  const { t } = useTranslation();

  // Only fetch if no cached tokens provided
  const shouldFetch = !cachedTokens || cachedTokens.length === 0;
  const { relatedTokens: fetchedTokens, isLoading } = useCardRelatedTokens(shouldFetch ? cards : []);

  const displayTokens: RelatedToken[] = cachedTokens && cachedTokens.length > 0 ? cachedTokens : fetchedTokens;

  // Save freshly fetched tokens to the parent for persistence
  useEffect(() => {
    if (!shouldFetch && fetchedTokens.length > 0 && onTokensLoaded) {
      onTokensLoaded(fetchedTokens);
    } else if (shouldFetch && !isLoading && fetchedTokens.length > 0 && onTokensLoaded) {
      onTokensLoaded(fetchedTokens);
    }
  }, [fetchedTokens, isLoading, shouldFetch, onTokensLoaded]);

  if (isLoading && shouldFetch) {
    return (
      <div className="h-64 flex flex-col items-center justify-center gap-3 text-gray-500 dark:text-gray-400">
        <FaSpinner className="text-3xl text-indigo-500 animate-spin" />
        <p className="text-xs font-semibold">{t('loadingTokens', 'Analisando deck para fichas relacionadas...')}</p>
      </div>
    );
  }

  if (displayTokens.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center gap-2.5 text-gray-400 dark:text-gray-500 text-center px-6">
        <FaInfoCircle className="text-2xl text-slate-500" />
        <p className="text-sm font-semibold">{t('noTokensFound', 'Nenhuma ficha relacionada encontrada para este deck.')}</p>
        <p className="text-xs text-slate-500 dark:text-slate-600 max-w-sm">
          {t(
            'noTokensExplanation',
            'Analisamos automaticamente seu deck em busca de cartas que invocam soldados, zumbis, tesouros, etc.'
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-left animate-fadeIn">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
        <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
          <FaPalette className="text-indigo-500" />
          {t('relatedTokens')}
        </h4>
        <span className="text-xs bg-gray-200 dark:bg-gray-750 px-2 py-0.5 rounded-full font-bold text-gray-600 dark:text-gray-300">
          {displayTokens.length}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
        {displayTokens.map(({ tokenCard, generatorCardName }) => {
          const imgUrl = tokenCard.image_uris?.normal || tokenCard.card_faces?.[0]?.image_uris?.normal || '';

          return (
            <button
              key={tokenCard.id}
              type="button"
              onClick={() => onTokenClick?.(tokenCard)}
              className="border border-gray-200 dark:border-gray-800 bg-white/40 dark:bg-gray-800/10 rounded-xl p-2.5 flex flex-col items-center justify-between shadow-xs hover:shadow-md transition-all duration-300 hover:scale-105 hover:border-indigo-500/40 group cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
              {/* Token Miniature Image */}
              <div className="relative w-full h-34 rounded-lg overflow-hidden border border-gray-100 dark:border-gray-800 bg-slate-950 flex items-center justify-center mb-2.5">
                {imgUrl ? (
                  <img
                    src={imgUrl}
                    alt={tokenCard.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 pointer-events-none"
                    loading="lazy"
                  />
                ) : (
                  <span className="text-[9px] text-gray-500 font-bold p-1 text-center leading-tight">
                    {tokenCard.name}
                  </span>
                )}
                {/* Click hint overlay */}
                <div className="absolute inset-0 bg-indigo-900/0 group-hover:bg-indigo-900/20 transition-colors duration-300 flex items-center justify-center">
                  <span className="text-[8px] text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity drop-shadow">
                    {t('clickToView', 'Ver')}
                  </span>
                </div>
              </div>

              {/* Text metadata */}
              <div className="w-full text-center space-y-0.5 min-w-0">
                <h5 className="text-[11px] font-bold text-gray-800 dark:text-gray-200 truncate leading-tight">
                  {tokenCard.printed_name || tokenCard.name}
                </h5>
                <p className="text-[8px] text-gray-400 dark:text-gray-500 truncate font-semibold uppercase tracking-wider">
                  {t('generatedBy')}: <span className="font-extrabold text-indigo-500">{generatorCardName}</span>
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default DeckTokensTab;
