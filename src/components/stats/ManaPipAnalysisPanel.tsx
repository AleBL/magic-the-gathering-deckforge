import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis
} from 'recharts';
import { FaTint } from 'react-icons/fa';
import { getSymbolUrl, parseTextWithSymbols } from '../../utils/symbolHelper';
import { DeckStatistics, MANA_COLORS } from '../../utils/deckStatistics';
import { ColorLabel } from './colorLabels';
import {
  CHART_BAR_RADIUS_HORIZONTAL,
  CHART_GRID_PROPS,
  CHART_STATUS,
  CHART_TICK_STYLE,
  MANA_CHART_COLOR,
  ManaColorKey
} from './chartTheme';
import { ChartFrame, ChartLegend, ChartSkeleton, ChartTooltip, useChartReady } from './ChartPrimitives';
import EmptyState from '../ui/EmptyState';

interface ManaPipAnalysisPanelProps {
  stats: DeckStatistics;
  colorLabels: Record<string, ColorLabel>;
}

// WUBRG plus true colorless ({C}) — rows only render for colors present in the deck.
const MANA_COLOR_ORDER = MANA_COLORS;
const LANDS_COLOR = CHART_STATUS.good;

interface ManaTickProps {
  x?: string | number;
  y?: string | number;
  payload?: { value: string };
}

function ManaSvgTick({ x = 0, y = 0, payload }: ManaTickProps) {
  if (!payload?.value) return null;
  const symbol = `{${payload.value}}`;
  const url = getSymbolUrl(symbol);
  const size = 20;
  const nx = Number(x);
  const ny = Number(y);
  return <image href={url} x={nx - size} y={ny - size / 2} width={size} height={size} aria-label={symbol} />;
}

export function ManaPipAnalysisPanel({ stats, colorLabels }: ManaPipAnalysisPanelProps) {
  const { t } = useTranslation();

  const chartData = useMemo(
    () =>
      MANA_COLOR_ORDER.map((color) => ({
        color,
        pips: stats.manaColorSymbolCounts[color] || 0,
        lands: stats.landColorCounts[color] || 0
      })).filter((d) => d.pips > 0 || d.lands > 0),
    [stats.manaColorSymbolCounts, stats.landColorCounts]
  );
  const ready = useChartReady([chartData]);
  const rowHeight = Math.max(chartData.length, 1) * 44 + 24;

  return (
    <div className="space-y-4 p-4 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-500/5 dark:bg-amber-950/10 transition-colors duration-300">
      <h4 className="font-bold text-sm text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-2">
        <FaTint className="text-amber-500 animate-pulse" />
        {t('stats.manaPipAnalysis')}
      </h4>
      <p className="text-xs text-gray-500 dark:text-gray-400">{t('stats.manaPipAnalysisDesc')}</p>

      {!ready ? (
        <ChartSkeleton height="h-40" />
      ) : chartData.length === 0 ? (
        <ChartFrame height="h-32" className="flex items-center justify-center">
          <EmptyState icon={<FaTint />} title={t('stats.noPipData')} />
        </ChartFrame>
      ) : (
        <>
          <ChartFrame style={{ height: rowHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 8, right: 12, left: 4, bottom: 8 }}
                barCategoryGap="28%"
                barGap={2}
              >
                <CartesianGrid {...CHART_GRID_PROPS} horizontal={false} />
                <XAxis type="number" tick={CHART_TICK_STYLE} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="color"
                  tick={(props) => <ManaSvgTick {...props} />}
                  tickLine={false}
                  axisLine={false}
                  width={28}
                />
                <RechartsTooltip
                  cursor={{ fill: 'var(--chart-grid)', opacity: 0.4 }}
                  content={({ active, payload, label }) => {
                    if (!payload || payload.length === 0) return null;
                    return (
                      <ChartTooltip
                        active={active}
                        title={
                          <>
                            <span className="flex items-center">{parseTextWithSymbols(`{${label}}`)}</span>
                            {colorLabels[label as string]?.name}
                          </>
                        }
                        rows={[
                          {
                            key: 'pips',
                            label: t('stats.pipsNeeded'),
                            value: payload.find((p) => p.dataKey === 'pips')?.value as number,
                            swatch: MANA_CHART_COLOR[label as ManaColorKey]
                          },
                          {
                            key: 'lands',
                            label: t('stats.landsAvailable'),
                            value: payload.find((p) => p.dataKey === 'lands')?.value as number,
                            swatch: LANDS_COLOR
                          }
                        ]}
                      />
                    );
                  }}
                />
                <Bar dataKey="pips" radius={CHART_BAR_RADIUS_HORIZONTAL} maxBarSize={16} isAnimationActive={false}>
                  {chartData.map((entry) => (
                    <Cell key={entry.color} fill={MANA_CHART_COLOR[entry.color]} />
                  ))}
                </Bar>
                <Bar dataKey="lands" radius={CHART_BAR_RADIUS_HORIZONTAL} maxBarSize={16} fill={LANDS_COLOR} />
              </BarChart>
            </ResponsiveContainer>
          </ChartFrame>
          <ChartLegend
            items={[
              { key: 'pips', label: t('stats.pipsNeeded'), swatch: 'var(--chart-mana-u)' },
              { key: 'lands', label: t('stats.landsAvailable'), swatch: LANDS_COLOR }
            ]}
          />
        </>
      )}
    </div>
  );
}
