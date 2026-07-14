import { Dispatch, SetStateAction, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { FaPalette } from 'react-icons/fa';
import { parseTextWithSymbols } from '../../utils/symbolHelper';
import { DeckStatistics, StatFilter } from '../../utils/deckStatistics';
import { ColorLabel } from './colorLabels';

interface ColorDistributionPanelProps {
  readonly stats: DeckStatistics;
  readonly colorLabels: Record<string, ColorLabel>;
  readonly activeFilter: StatFilter | null;
  readonly setActiveFilter: Dispatch<SetStateAction<StatFilter | null>>;
}

/** Minimal shape of the Recharts `Pie` click payload we actually read. */
interface PieClickPayload {
  colorKey?: string;
  payload?: { colorKey?: string };
}

export function ColorDistributionPanel({
  stats,
  colorLabels,
  activeFilter,
  setActiveFilter
}: ColorDistributionPanelProps) {
  const { t } = useTranslation();

  const chartData = useMemo(() => {
    if (stats.totalColorsOccurrenceCount === 0) return [];

    // Filter out 'C' (Colorless)
    const validColors = Object.entries(stats.colorDistributionCounts).filter(([colorKey]) => colorKey !== 'C');
    const maxCount = Math.max(...validColors.map(([, count]) => count), 1);
    const totalValidColors = validColors.reduce((sum, [, count]) => sum + count, 0);

    return validColors.map(([colorKey, count]) => {
      const meta = colorLabels[colorKey];
      const pct = count > 0 && totalValidColors > 0 ? ((count / totalValidColors) * 100).toFixed(0) : '0';

      let hexColor = '#8b5cf6'; // default
      if (colorKey === 'W') hexColor = '#f3f4f6'; // light gray/ivory
      if (colorKey === 'U') hexColor = '#0ea5e9'; // sky blue
      if (colorKey === 'B') hexColor = '#3f3f46'; // visible dark gray (zinc-700) instead of pitch black
      if (colorKey === 'R') hexColor = '#ef4444'; // red
      if (colorKey === 'G') hexColor = '#22c55e'; // green

      return {
        subject: meta.name,
        A: count,
        pct: pct,
        fullMark: maxCount,
        colorKey,
        meta,
        hexColor
      };
    });
  }, [stats, colorLabels]);

  return (
    <div className="space-y-4 relative z-10 min-w-0">
      <h4 className="font-bold text-sm text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-2">
        <FaPalette className="text-purple-500" />
        {t('stats.colorsDistribution')}
      </h4>

      {chartData.some((d) => d.A > 0) ? (
        <div className="w-full h-64 sm:h-72 bg-white/50 dark:bg-slate-900/50 rounded-xl p-2 shadow-inner border border-slate-200 dark:border-slate-800 backdrop-blur-sm relative z-20">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="A"
                nameKey="subject"
                cx="50%"
                cy="50%"
                innerRadius="45%"
                outerRadius="75%"
                paddingAngle={5}
                stroke="none"
                onClick={(data: PieClickPayload) => {
                  const colorKey = data?.payload?.colorKey || data?.colorKey;
                  if (colorKey) {
                    setActiveFilter((prev) =>
                      prev?.type === 'color' && prev.value === colorKey ? null : { type: 'color', value: colorKey }
                    );
                  }
                }}
              >
                {chartData.map((entry, index) => {
                  const isSelected = activeFilter?.type === 'color' && activeFilter.value === entry.colorKey;
                  const isOtherSelected = activeFilter?.type === 'color' && activeFilter.value !== entry.colorKey;

                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.hexColor}
                      fillOpacity={isOtherSelected ? 0.2 : 1}
                      stroke={isSelected ? 'currentColor' : 'none'}
                      strokeWidth={isSelected ? 3 : 0}
                      className="dark:stroke-slate-900 stroke-white"
                      style={{ outline: 'none', cursor: 'pointer', transition: 'all 0.3s ease' }}
                    />
                  );
                })}
              </Pie>
              <RechartsTooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900/90 backdrop-blur-md text-white text-xs p-3 rounded-lg shadow-xl border border-slate-700/50">
                        <div className="flex items-center gap-2 mb-1.5 pb-1.5 border-b border-slate-700">
                          <span className="flex items-center shadow-sm">
                            {parseTextWithSymbols(`{${data.colorKey}}`)}
                          </span>
                          <span className="font-bold">{data.subject}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="font-medium text-slate-300">
                            {t('common.cards')}: <span className="text-white font-bold">{data.A}</span>
                          </span>
                          <span className="font-medium text-slate-300">
                            {t('stats.percentage')}: <span className="text-white font-bold">{data.pct}%</span>
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="text-sm text-slate-500 italic text-center p-4 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
          {t('export.noColorData')}
        </div>
      )}

      <div className="flex flex-wrap gap-2 mt-4 relative z-20">
        {chartData
          .filter((d) => d.A > 0)
          .map((data) => (
            <button
              key={data.colorKey}
              onClick={() =>
                setActiveFilter((prev) =>
                  prev?.type === 'color' && prev.value === data.colorKey
                    ? null
                    : { type: 'color', value: data.colorKey }
                )
              }
              className={`px-3 py-1 rounded-full text-xs font-bold border transition-all flex items-center gap-1.5 ${activeFilter?.type === 'color' && activeFilter.value === data.colorKey ? 'ring-2 ring-indigo-500 ring-offset-1 dark:ring-offset-slate-900 shadow-md scale-105' : 'opacity-80 hover:opacity-100 hover:scale-105'}`}
            >
              <span className="flex items-center shadow-sm">{parseTextWithSymbols(`{${data.colorKey}}`)}</span>
              {data.subject} ({data.A})
            </button>
          ))}
      </div>
    </div>
  );
}
