import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FaDiceD20 } from 'react-icons/fa';
import { DeckStatistics, landDrawProbabilities } from '../../utils/deckStatistics';

interface ConsistencyPanelProps {
  stats: DeckStatistics;
}

const HAND_SIZE = 7;
// A hand with 2–5 lands is generally keepable.
const KEEPABLE_MIN = 2;
const KEEPABLE_MAX = 5;

/** Hypergeometric probability of drawing each land count in the opening hand. */
export function ConsistencyPanel({ stats }: ConsistencyPanelProps) {
  const { t } = useTranslation();
  const deckSize = stats.totalCards;
  const landCount = stats.cardTypeCounts.land;

  const distribution = useMemo(() => landDrawProbabilities(deckSize, landCount, HAND_SIZE), [deckSize, landCount]);

  if (distribution.length === 0 || landCount === 0) return null;

  const maxProb = Math.max(...distribution.map((d) => d.prob), 0.0001);
  const keepable = distribution
    .filter((d) => d.lands >= KEEPABLE_MIN && d.lands <= KEEPABLE_MAX)
    .reduce((sum, d) => sum + d.prob, 0);
  const expectedLands = (HAND_SIZE * landCount) / deckSize;

  return (
    <div className="md:col-span-2 space-y-4 p-4 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-500/5 dark:bg-indigo-950/10 transition-colors duration-300">
      <h4 className="font-bold text-sm text-indigo-700 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-2">
        <FaDiceD20 className="text-indigo-500" />
        {t('stats.consistency')}
      </h4>
      <p className="text-xs text-gray-500 dark:text-gray-400">{t('stats.consistencyDesc')}</p>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/80 dark:bg-gray-850/80 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <span className="text-[9px] uppercase tracking-wider text-gray-400 block font-bold">
            {t('stats.keepableHands')}
          </span>
          <span className="text-base font-extrabold text-indigo-600 dark:text-indigo-400 tabular-nums">
            {(keepable * 100).toFixed(0)}%
          </span>
        </div>
        <div className="bg-white/80 dark:bg-gray-850/80 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <span className="text-[9px] uppercase tracking-wider text-gray-400 block font-bold">
            {t('stats.avgLandsInHand')}
          </span>
          <span className="text-base font-extrabold text-indigo-600 dark:text-indigo-400 tabular-nums">
            {expectedLands.toFixed(1)}
          </span>
        </div>
      </div>

      <div className="space-y-1.5 pt-1">
        {distribution.map(({ lands, prob }) => {
          const isKeepable = lands >= KEEPABLE_MIN && lands <= KEEPABLE_MAX;
          return (
            <div key={lands} className="flex items-center gap-2 text-xs">
              <span className="w-16 shrink-0 text-gray-600 dark:text-gray-400 font-medium tabular-nums">
                {t('stats.nLands', { count: lands })}
              </span>
              <div className="flex-1 h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${isKeepable ? 'bg-indigo-500' : 'bg-slate-400 dark:bg-slate-600'}`}
                  style={{ width: `${(prob / maxProb) * 100}%` }}
                />
              </div>
              <span className="w-9 shrink-0 text-right font-bold text-gray-800 dark:text-gray-200 tabular-nums">
                {(prob * 100).toFixed(0)}%
              </span>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-gray-400 dark:text-gray-500">
        {t('stats.consistencyBasis', { lands: landCount, total: deckSize })}
      </p>
    </div>
  );
}
