import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from 'recharts';
import { LuDroplet, LuInfo, LuTriangleAlert } from 'react-icons/lu';
import { DeckStatistics, MANA_COLOR_TO_BASIC_LAND } from '../../utils/deckStatistics';
import { CHART_BAR_RADIUS_HORIZONTAL, CHART_TICK_STYLE, MANA_CHART_COLOR, ManaColorKey } from './chartTheme';
import { ChartFrame, ChartTooltip } from './ChartPrimitives';

interface ManaBaseOptimizerPanelProps {
  stats: DeckStatistics;
  onApplySuggestedLands?: (landCounts: Record<string, number>) => void;
}

// Inverse of the canonical color→land map, so a new basic land kind only ever
// needs to be added in deckStatistics.
const LAND_TO_MANA_COLOR: Record<string, ManaColorKey> = Object.fromEntries(
  Object.entries(MANA_COLOR_TO_BASIC_LAND).map(([color, landName]) => [landName, color as ManaColorKey])
);

export function ManaBaseOptimizerPanel({ stats, onApplySuggestedLands }: ManaBaseOptimizerPanelProps) {
  const { t } = useTranslation();

  const chartData = useMemo(
    () =>
      Object.entries(stats.suggestedBasicLandCounts)
        .filter(([, count]) => count > 0)
        .map(([landName, count]) => ({
          landName,
          label: t(`land.${landName.toLowerCase()}`),
          count,
          color: MANA_CHART_COLOR[LAND_TO_MANA_COLOR[landName] ?? 'C']
        })),
    [stats.suggestedBasicLandCounts, t]
  );
  const rowHeight = Math.max(chartData.length, 1) * 32 + 16;

  return (
    <div className="space-y-4 p-4 rounded-xl border border-line bg-surface-1">
      <h4 className="font-semibold text-sm text-accent flex items-center gap-2">
        <LuInfo className="text-accent" />
        {t('stats.manaBaseOptimizer')}
      </h4>
      <p className="text-xs text-fg-muted">
        {t('stats.manaBaseExplanation').replace('{{target}}', String(stats.targetTotalLands))}
      </p>
      {stats.neededBasicLands > 0 ? (
        <>
          {/* Current → target → delta at a glance; the chart below only shows
              HOW the added basics are split across colors. */}
          <div className="grid grid-cols-3 gap-3">
            <div className="stat-tile">
              <span className="stat-tile-label">{t('stats.currentLands')}</span>
              <span className="text-base font-semibold text-fg-secondary tabular-nums">{stats.totalLands}</span>
            </div>
            <div className="stat-tile">
              <span className="stat-tile-label">{t('stats.targetLands')}</span>
              <span className="text-base font-semibold text-fg-secondary tabular-nums">{stats.targetTotalLands}</span>
            </div>
            <div className="stat-tile">
              <span className="stat-tile-label">{t('stats.landsToAdd')}</span>
              <span className="text-base font-semibold text-accent tabular-nums">+{stats.neededBasicLands}</span>
            </div>
          </div>

          {stats.removeCount > 0 ? (
            <div className="p-3 bg-warning-soft border border-warning/40 rounded-xl flex items-start gap-2.5 mt-2 animate-fadeIn">
              <LuTriangleAlert className="text-warning shrink-0 mt-0.5" />
              <p className="text-[11px] text-warning font-medium leading-relaxed">
                {t('stats.manaBaseWarning')
                  .replace('{{finalSize}}', String(stats.finalDeckSize))
                  .replace('{{limit}}', String(stats.targetDeckLimit))
                  .replace('{{removeCount}}', String(stats.removeCount))}
              </p>
            </div>
          ) : null}

          {chartData.length > 0 ? (
            <>
              <span className="stat-tile-label">{t('stats.suggestedDistribution')}</span>
              <ChartFrame style={{ height: rowHeight }} className="mt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    layout="vertical"
                    margin={{ top: 4, right: 12, left: 4, bottom: 4 }}
                    barCategoryGap="24%"
                  >
                    <XAxis type="number" hide allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="label"
                      tick={CHART_TICK_STYLE}
                      tickLine={false}
                      axisLine={false}
                      width={64}
                    />
                    <RechartsTooltip
                      cursor={{ fill: 'var(--chart-grid)', opacity: 0.4 }}
                      content={({ active, payload }) => {
                        const d = payload?.[0]?.payload as { label: string; count: number; color: string } | undefined;
                        if (!d) return null;
                        return (
                          <ChartTooltip
                            active={active}
                            title={d.label}
                            rows={[{ key: 'count', label: t('common.cards'), value: d.count, swatch: d.color }]}
                          />
                        );
                      }}
                    />
                    <Bar dataKey="count" radius={CHART_BAR_RADIUS_HORIZONTAL} maxBarSize={20}>
                      {chartData.map((entry) => (
                        <Cell key={entry.landName} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartFrame>
            </>
          ) : null}

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
        <div className="flex items-center gap-2 mt-4 text-success dark:text-success bg-success-soft p-3 rounded-lg border border-success/40">
          <LuDroplet className="shrink-0" />
          <p className="text-xs font-semibold">{t('stats.landsAlreadySufficient')}</p>
        </div>
      )}
    </div>
  );
}
