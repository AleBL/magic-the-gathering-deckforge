import { useTranslation } from 'react-i18next';
import { FaCoins, FaStar } from 'react-icons/fa';
import { DeckStatistics } from '../../utils/deckStatistics';

interface BudgetEstimatorPanelProps {
  stats: DeckStatistics;
}

export function BudgetEstimatorPanel({ stats }: BudgetEstimatorPanelProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4 p-4 rounded-xl border border-purple-200 dark:border-purple-900 bg-purple-500/5 dark:bg-purple-950/10 transition-colors duration-300">
      <h4 className="font-bold text-sm text-purple-700 dark:text-purple-400 uppercase tracking-wider flex items-center gap-2">
        <FaCoins className="text-purple-500" />
        {t('stats.budgetEstimator')}
      </h4>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/80 dark:bg-gray-850/80 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <span className="text-[9px] uppercase tracking-wider text-gray-400 block font-bold">
            {t('stats.totalUsd')}
          </span>
          <span className="text-base font-extrabold text-purple-600 dark:text-purple-400 tabular-nums">
            ${stats.totalUsdPrice.toFixed(2)}
          </span>
        </div>
        <div className="bg-white/80 dark:bg-gray-850/80 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <span className="text-[9px] uppercase tracking-wider text-gray-400 block font-bold">
            {t('stats.totalEur')}
          </span>
          <span className="text-base font-extrabold text-purple-600 dark:text-purple-400 tabular-nums">
            €{stats.totalEurPrice.toFixed(2)}
          </span>
        </div>
      </div>

      {stats.mostExpensiveCards.length > 0 ? (
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
            <FaStar className="text-amber-500" />
            {t('stats.topExpensiveCards')}
          </span>
          <div className="space-y-1 text-xs">
            {stats.mostExpensiveCards.map((card) => (
              <div
                key={card.id}
                className="flex justify-between items-center bg-white/60 dark:bg-gray-800/40 px-2.5 py-1.5 rounded-lg border border-gray-150 dark:border-gray-700 shadow-xs"
              >
                <span className="flex-1 min-w-0 truncate mr-2 text-gray-700 dark:text-gray-300 font-medium">
                  {card.printed_name || card.name}
                </span>
                <span className="font-extrabold text-purple-600 dark:text-purple-400 tabular-nums">
                  ${parseFloat(card.prices?.usd || '0').toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
