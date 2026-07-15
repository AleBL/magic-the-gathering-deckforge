import { useTranslation } from 'react-i18next';
import { FaTint } from 'react-icons/fa';
import { DeckStatistics } from '../../utils/deckStatistics';
import { ColorLabel } from './colorLabels';

interface ManaPipAnalysisPanelProps {
  stats: DeckStatistics;
  colorLabels: Record<string, ColorLabel>;
}

export function ManaPipAnalysisPanel({ stats, colorLabels }: ManaPipAnalysisPanelProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4 p-4 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-500/5 dark:bg-amber-950/10 transition-colors duration-300">
      <h4 className="font-bold text-sm text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-2">
        <FaTint className="text-amber-500 animate-pulse" />
        {t('stats.manaPipAnalysis')}
      </h4>
      <p className="text-xs text-gray-500 dark:text-gray-400">{t('stats.manaPipAnalysisDesc')}</p>

      <div className="space-y-3 pt-1">
        {['W', 'U', 'B', 'R', 'G'].map((color) => {
          const pipsCount = stats.manaColorSymbolCounts[color as 'W' | 'U' | 'B' | 'R' | 'G'] || 0;
          const landsCount = stats.landColorCounts[color as 'W' | 'U' | 'B' | 'R' | 'G'] || 0;

          if (pipsCount === 0 && landsCount === 0) return null;

          const meta = colorLabels[color];
          const total = Math.max(pipsCount + landsCount, 1);
          const pipsPct = Math.round((pipsCount / total) * 100);
          const landsPct = Math.round((landsCount / total) * 100);

          return (
            <div key={color} className="space-y-1">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                  <span className={`w-2.5 h-2.5 rounded-full inline-block ${meta.fill}`} />
                  {meta.name}
                </span>
                <div className="flex flex-col sm:flex-row sm:justify-between text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mb-1 gap-1">
                  <span>
                    {t('stats.pipsNeeded')}:{' '}
                    <span className="font-bold text-gray-900 dark:text-gray-100 tabular-nums">{pipsCount}</span>
                  </span>
                  <span>
                    {t('stats.landsAvailable')}:{' '}
                    <span className="font-bold text-gray-900 dark:text-gray-100 tabular-nums">{landsCount}</span>
                  </span>
                </div>
              </div>
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex shadow-inner">
                <div
                  className={`h-full opacity-90 transition-all duration-500 ${meta.fill}`}
                  style={{ width: `${pipsPct}%` }}
                  title={`${t('stats.pipsNeeded')}: ${pipsCount}`}
                />
                <div
                  className="h-full bg-emerald-500 opacity-60 transition-all duration-500"
                  style={{ width: `${landsPct}%` }}
                  title={`${t('stats.landsAvailable')}: ${landsCount}`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
