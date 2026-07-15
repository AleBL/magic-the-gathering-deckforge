import { useTranslation } from 'react-i18next';
import { FaInfoCircle, FaExclamationTriangle, FaTint } from 'react-icons/fa';
import { DeckStatistics } from '../../utils/deckStatistics';

interface ManaBaseOptimizerPanelProps {
  stats: DeckStatistics;
  onApplySuggestedLands?: (landCounts: Record<string, number>) => void;
}

export function ManaBaseOptimizerPanel({ stats, onApplySuggestedLands }: ManaBaseOptimizerPanelProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4 p-4 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-500/5 dark:bg-blue-950/10 transition-colors duration-300">
      <h4 className="font-bold text-sm text-blue-700 dark:text-blue-400 uppercase tracking-wider flex items-center gap-2">
        <FaInfoCircle className="text-blue-500" />
        {t('stats.manaBaseOptimizer')}
      </h4>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {t('stats.manaBaseExplanation').replace('{{target}}', String(stats.targetTotalLands))}
      </p>
      {stats.neededBasicLands > 0 ? (
        <>
          <p className="text-xs font-semibold text-primary dark:text-blue-400 mt-1">
            {t('stats.willAddLands').replace('{{count}}', String(stats.neededBasicLands))}
          </p>

          {stats.removeCount > 0 ? (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl flex items-start gap-2.5 mt-2 animate-fadeIn">
              <FaExclamationTriangle className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-800 dark:text-amber-300 font-medium leading-relaxed">
                {t('stats.manaBaseWarning')
                  .replace('{{finalSize}}', String(stats.finalDeckSize))
                  .replace('{{limit}}', String(stats.targetDeckLimit))
                  .replace('{{removeCount}}', String(stats.removeCount))}
              </p>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2 pt-1">
            {Object.entries(stats.suggestedBasicLandCounts).map(([landName, count]) => {
              if (count === 0) return null;
              return (
                <div
                  key={landName}
                  className="flex items-center gap-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-1 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-200 shadow-sm"
                >
                  <span className="text-[10px] uppercase text-gray-400 dark:text-gray-500 font-bold">
                    {t(`land.${landName.toLowerCase()}`)}
                  </span>
                  <span className="font-bold text-primary dark:text-blue-400">{count}</span>
                </div>
              );
            })}
          </div>

          {onApplySuggestedLands ? (
            <button
              type="button"
              onClick={() => onApplySuggestedLands(stats.suggestedBasicLandCounts)}
              className="primary-button text-xs py-1.5 px-4 mt-2 w-full justify-center shadow-sm font-semibold"
            >
              {t('stats.applySuggestedLands')}
            </button>
          ) : null}
        </>
      ) : (
        <div className="flex items-center gap-2 mt-4 text-success dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
          <FaTint className="shrink-0" />
          <p className="text-xs font-semibold">{t('stats.landsAlreadySufficient')}</p>
        </div>
      )}
    </div>
  );
}
