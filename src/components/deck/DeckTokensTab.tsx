import { useTranslation } from 'react-i18next';
import { FaSpinner, FaPalette, FaInfoCircle } from 'react-icons/fa';
import { Card } from '../../types/Card';
import { useCardRelatedTokens } from '../../hooks/useCardRelatedTokens';

interface DeckTokensTabProps {
  cards: Card[];
}

function DeckTokensTab({ cards }: DeckTokensTabProps) {
  const { t } = useTranslation();
  const { relatedTokens, isLoading } = useCardRelatedTokens(cards);

  if (isLoading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center gap-3 text-gray-500 dark:text-gray-400">
        <FaSpinner className="text-3xl text-indigo-500 animate-spin" />
        <p className="text-xs font-semibold">{t('loadingTokens', 'Loading related tokens from Scryfall...')}</p>
      </div>
    );
  }

  if (relatedTokens.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center gap-2.5 text-gray-400 dark:text-gray-500 text-center px-6">
        <FaInfoCircle className="text-2xl text-slate-500" />
        <p className="text-sm font-semibold">{t('noTokensFound', 'No related tokens found for this deck.')}</p>
        <p className="text-xs text-slate-500 dark:text-slate-600 max-w-sm">
          {t(
            'noTokensExplanation',
            'We automatically analyze your deck for cards that summon soldiers, zombies, treasures, etc. and display them here.'
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
          {relatedTokens.length}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
        {relatedTokens.map(({ tokenCard, generatorCardName }) => {
          const imgUrl = tokenCard.image_uris?.normal || tokenCard.card_faces?.[0]?.image_uris?.normal || '';

          return (
            <div
              key={tokenCard.id}
              className="border border-gray-200 dark:border-gray-800 bg-white/40 dark:bg-gray-800/10 rounded-xl p-2.5 flex flex-col items-center justify-between shadow-xs hover:shadow-md transition-all duration-300 hover:scale-102 hover:border-indigo-500/20 group"
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
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default DeckTokensTab;
