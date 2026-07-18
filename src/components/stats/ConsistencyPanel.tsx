import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from 'recharts';
import { FaDiceD20 } from 'react-icons/fa';
import { DeckStatistics, landDrawProbabilities } from '../../utils/deckStatistics';
import { CHART_BAR_RADIUS_VERTICAL, CHART_STATUS, CHART_TEXT_MUTED, CHART_TICK_STYLE } from './chartTheme';
import { ChartFrame, ChartSkeleton, ChartTooltip, useChartReady } from './ChartPrimitives';
import EmptyState from '../ui/EmptyState';

interface ConsistencyPanelProps {
  stats: DeckStatistics;
}

const HAND_SIZE = 7;
// A hand with 2–5 lands is generally keepable.
const KEEPABLE_MIN = 2;
const KEEPABLE_MAX = 5;

const KEEPABLE_COLOR = CHART_STATUS.good;
const OTHER_COLOR = CHART_TEXT_MUTED;

/** Hypergeometric probability of drawing each land count in the opening hand. */
export function ConsistencyPanel({ stats }: ConsistencyPanelProps) {
  const { t } = useTranslation();
  const deckSize = stats.totalCards;
  // totalLands (type_line based) rather than cardTypeCounts.land, which files
  // "Artifact Land"/"Creature — Land" under other types and undercounts.
  const landCount = stats.totalLands;

  const distribution = useMemo(() => landDrawProbabilities(deckSize, landCount, HAND_SIZE), [deckSize, landCount]);
  const ready = useChartReady([distribution]);
  const hasData = distribution.length > 0 && landCount > 0;

  const keepable = distribution
    .filter((d) => d.lands >= KEEPABLE_MIN && d.lands <= KEEPABLE_MAX)
    .reduce((sum, d) => sum + d.prob, 0);
  const expectedLands = hasData ? (HAND_SIZE * landCount) / deckSize : 0;

  return (
    <div className="md:col-span-2 space-y-4 p-4 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-500/5 dark:bg-indigo-950/10 transition-colors duration-300">
      <h4 className="font-bold text-sm text-indigo-700 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-2">
        <FaDiceD20 className="text-indigo-500" />
        {t('stats.consistency')}
      </h4>
      <p className="text-xs text-gray-500 dark:text-gray-400">{t('stats.consistencyDesc')}</p>

      {!ready ? (
        <ChartSkeleton height="h-40" />
      ) : !hasData ? (
        <ChartFrame height="h-32" className="flex items-center justify-center overflow-hidden">
          <EmptyState compact icon={<FaDiceD20 />} title={t('stats.noConsistencyData')} />
        </ChartFrame>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/80 dark:bg-slate-800/80 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <span className="text-[9px] uppercase tracking-wider text-gray-400 block font-bold">
                {t('stats.keepableHands')}
              </span>
              <span className="text-base font-extrabold text-indigo-600 dark:text-indigo-400 tabular-nums">
                {(keepable * 100).toFixed(0)}%
              </span>
            </div>
            <div className="bg-white/80 dark:bg-slate-800/80 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <span className="text-[9px] uppercase tracking-wider text-gray-400 block font-bold">
                {t('stats.avgLandsInHand')}
              </span>
              <span className="text-base font-extrabold text-indigo-600 dark:text-indigo-400 tabular-nums">
                {expectedLands.toFixed(1)}
              </span>
            </div>
          </div>

          <ChartFrame height="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distribution} margin={{ top: 8, right: 4, left: 4, bottom: 0 }} barCategoryGap="20%">
                <XAxis
                  dataKey="lands"
                  tick={CHART_TICK_STYLE}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(lands: number) => t('stats.nLands', { count: lands })}
                />
                <YAxis hide />
                <RechartsTooltip
                  cursor={{ fill: 'var(--chart-grid)', opacity: 0.4 }}
                  content={({ active, payload }) => {
                    const d = payload?.[0]?.payload as { lands: number; prob: number } | undefined;
                    if (!d) return null;
                    const isKeepable = d.lands >= KEEPABLE_MIN && d.lands <= KEEPABLE_MAX;
                    return (
                      <ChartTooltip
                        active={active}
                        title={t('stats.nLands', { count: d.lands })}
                        rows={[
                          {
                            key: 'prob',
                            label: t('stats.percentage'),
                            value: `${(d.prob * 100).toFixed(0)}%`,
                            swatch: isKeepable ? KEEPABLE_COLOR : OTHER_COLOR
                          }
                        ]}
                      />
                    );
                  }}
                />
                <Bar dataKey="prob" radius={CHART_BAR_RADIUS_VERTICAL} maxBarSize={28}>
                  {distribution.map((d) => {
                    const isKeepable = d.lands >= KEEPABLE_MIN && d.lands <= KEEPABLE_MAX;
                    return <Cell key={d.lands} fill={isKeepable ? KEEPABLE_COLOR : OTHER_COLOR} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartFrame>

          <p className="text-[10px] text-gray-400 dark:text-gray-500">
            {t('stats.consistencyBasis', { lands: landCount, total: deckSize })}
          </p>
        </>
      )}
    </div>
  );
}
