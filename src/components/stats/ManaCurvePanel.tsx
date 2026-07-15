import { Dispatch, SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import { FaChartBar } from 'react-icons/fa';
import { DeckStatistics, StatFilter } from '../../utils/deckStatistics';

interface ManaCurvePanelProps {
  stats: DeckStatistics;
  activeFilter: StatFilter | null;
  setActiveFilter: Dispatch<SetStateAction<StatFilter | null>>;
}

export function ManaCurvePanel({ stats, activeFilter, setActiveFilter }: ManaCurvePanelProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4 min-w-0">
      <h4 className="font-bold text-sm text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-2">
        <FaChartBar className="text-blue-500" />
        {t('stats.manaCurve')}
      </h4>
      <div className="flex items-end justify-between h-40 pt-6 px-2 border-b border-gray-200 dark:border-gray-700">
        {Object.entries(stats.convertedManaCostCounts).map(([convertedManaCost, count]) => {
          const heightPct = `${(count / stats.maximumConvertedManaCostCount) * 100}%`;
          return (
            <div
              key={convertedManaCost}
              className={`mana-bar-group group flex-1 h-full flex flex-col justify-end cursor-pointer transition-opacity duration-200 ${activeFilter?.type === 'cmc' && activeFilter.value !== convertedManaCost ? 'opacity-30' : 'opacity-100 hover:opacity-80'}`}
              onClick={() =>
                setActiveFilter((prev) =>
                  prev?.type === 'cmc' && prev.value === convertedManaCost
                    ? null
                    : { type: 'cmc', value: convertedManaCost }
                )
              }
            >
              <div className="mana-bar-tooltip">
                {count} {t('common.cards')}
              </div>
              <div className="h-24 w-full flex items-end justify-center">
                <div className="mana-bar-column" style={{ height: heightPct }} />
              </div>
              <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 mt-2 block text-center">
                {convertedManaCost}
              </span>
            </div>
          );
        })}
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
        {t('stats.averageCmc')}:{' '}
        <span className="font-bold text-gray-800 dark:text-gray-200 tabular-nums">
          {stats.averageConvertedManaCost}
        </span>
      </div>
    </div>
  );
}
