import { useTranslation } from 'react-i18next';
import { FaGem } from 'react-icons/fa';
import { DeckStatistics } from '../../utils/deckStatistics';

interface RarityPanelProps {
  stats: DeckStatistics;
}

const RARITY_META: Record<string, { labelKey: string; bar: string; dot: string }> = {
  common: { labelKey: 'stats.rarityCommon', bar: 'bg-slate-400', dot: 'bg-slate-400' },
  uncommon: { labelKey: 'stats.rarityUncommon', bar: 'bg-sky-400', dot: 'bg-sky-400' },
  rare: { labelKey: 'stats.rarityRare', bar: 'bg-amber-400', dot: 'bg-amber-400' },
  mythic: { labelKey: 'stats.rarityMythic', bar: 'bg-orange-500', dot: 'bg-orange-500' }
};

/** Distribution of the deck's cards by Scryfall rarity. */
export function RarityPanel({ stats }: RarityPanelProps) {
  const { t } = useTranslation();

  const entries = Object.entries(stats.rarityCounts).filter(([, count]) => count > 0);
  const total = entries.reduce((sum, [, count]) => sum + count, 0);

  if (total === 0) return null;

  return (
    <div className="space-y-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-500/5 dark:bg-slate-900/20 transition-colors duration-300">
      <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
        <FaGem className="text-sky-500" />
        {t('stats.rarityBreakdown')}
      </h4>

      <div className="w-full h-3 rounded-full overflow-hidden flex shadow-inner bg-gray-200 dark:bg-gray-700">
        {entries.map(([rarity, count]) => (
          <div
            key={rarity}
            className={`h-full ${RARITY_META[rarity]?.bar ?? 'bg-slate-400'} transition-all duration-500`}
            style={{ width: `${(count / total) * 100}%` }}
            title={`${t(RARITY_META[rarity]?.labelKey ?? rarity)}: ${count}`}
          />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        {entries.map(([rarity, count]) => (
          <div key={rarity} className="flex items-center gap-1.5">
            <span
              className={`w-2.5 h-2.5 rounded-full inline-block shrink-0 ${RARITY_META[rarity]?.dot ?? 'bg-slate-400'}`}
            />
            <span className="text-gray-600 dark:text-gray-400 font-medium capitalize">
              {t(RARITY_META[rarity]?.labelKey ?? rarity)}
            </span>
            <span className="ml-auto font-bold text-gray-800 dark:text-gray-200 tabular-nums">
              {count} <span className="text-gray-400 font-normal">({((count / total) * 100).toFixed(0)}%)</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
