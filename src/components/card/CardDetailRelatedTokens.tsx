import { useTranslation } from 'react-i18next';
import { Card } from '../../types/Card';
import { getCardImageUrl } from '../../utils/deckGrouping';

interface CardDetailRelatedTokensProps {
  relatedTokens: Card[];
  onCardClick: (card: Card) => void;
}

export function CardDetailRelatedTokens({ relatedTokens, onCardClick }: CardDetailRelatedTokensProps) {
  const { t } = useTranslation();

  if (relatedTokens.length === 0) return null;

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-3">
      <h3 className="font-bold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-1.5 mb-3 select-none">
        <span>{t('tokens.relatedTokens')}</span>
      </h3>
      <div className="flex flex-wrap gap-2">
        {relatedTokens.map((token) => (
          <button
            type="button"
            key={token.id}
            onClick={() => onCardClick(token)}
            className="group relative w-16 md:w-20 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 transition-all shadow-sm hover:shadow-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
            title={token.name}
          >
            {getCardImageUrl(token) ? (
              <img
                src={getCardImageUrl(token)}
                alt={token.name}
                className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            ) : (
              <div className="w-full aspect-[2.5/3.5] bg-gray-100 dark:bg-gray-800 flex items-center justify-center p-1">
                <span className="text-[10px] text-center font-medium text-gray-500 line-clamp-3">{token.name}</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
          </button>
        ))}
      </div>
    </div>
  );
}
