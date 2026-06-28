import { Dispatch, SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import { FaFileInvoice } from 'react-icons/fa';
import { DeckStatistics, StatFilter } from '../../utils/deckStatistics';

interface TypesBreakdownPanelProps {
  stats: DeckStatistics;
  activeFilter: StatFilter | null;
  setActiveFilter: Dispatch<SetStateAction<StatFilter | null>>;
}

export function TypesBreakdownPanel({ stats, activeFilter, setActiveFilter }: TypesBreakdownPanelProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4 min-w-0">
      <h4 className="font-bold text-sm text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-2">
        <FaFileInvoice className="text-green-500" />
        {t('stats.typesBreakdown')}
      </h4>
      <div className="grid grid-cols-2 gap-2 text-xs">
        {Object.entries(stats.cardTypeCounts).map(([typeKey, count]) => {
          if (count === 0) return null;
          return (
            <div
              key={typeKey}
              onClick={() =>
                setActiveFilter((prev) =>
                  prev?.type === 'type' && prev.value === typeKey ? null : { type: 'type', value: typeKey }
                )
              }
              className={`p-2 border rounded-lg flex justify-between items-center transition-all cursor-pointer ${
                activeFilter?.type === 'type' && activeFilter.value === typeKey
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 ring-1 ring-blue-500'
                  : 'border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/20 hover:bg-gray-100/50 dark:hover:bg-gray-800/40'
              } ${activeFilter?.type === 'type' && activeFilter.value !== typeKey ? 'opacity-40' : 'opacity-100'}`}
            >
              <span className="capitalize text-gray-600 dark:text-gray-400 font-medium">{t(`search.${typeKey}`)}</span>
              <span className="font-bold text-gray-800 dark:text-gray-200 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full text-[10px]">
                {count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
