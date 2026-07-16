import { Dispatch, SetStateAction, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bar,
  BarChart,
  BarRectangleItem,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis
} from 'recharts';
import { FaFileInvoice } from 'react-icons/fa';
import { DeckStatistics, StatFilter } from '../../utils/deckStatistics';
import { CHART_BAR_RADIUS_HORIZONTAL, CHART_CATEGORICAL, CHART_TICK_STYLE } from './chartTheme';
import { ChartFrame, ChartSkeleton, ChartTooltip, useChartReady } from './ChartPrimitives';
import EmptyState from '../ui/EmptyState';

interface TypesBreakdownPanelProps {
  stats: DeckStatistics;
  activeFilter: StatFilter | null;
  setActiveFilter: Dispatch<SetStateAction<StatFilter | null>>;
}

/** Fixed type key order — each pinned to a categorical slot by identity, never by rank. */
const TYPE_KEYS = ['creature', 'instant', 'sorcery', 'enchantment', 'artifact', 'planeswalker', 'land'] as const;

export function TypesBreakdownPanel({ stats, activeFilter, setActiveFilter }: TypesBreakdownPanelProps) {
  const { t } = useTranslation();

  const chartData = useMemo(
    () =>
      TYPE_KEYS.map((typeKey, index) => ({
        typeKey,
        label: t(`search.${typeKey}`),
        count: stats.cardTypeCounts[typeKey] || 0,
        color: CHART_CATEGORICAL[index]
      })).filter((d) => d.count > 0),
    [stats.cardTypeCounts, t]
  );
  const ready = useChartReady([chartData]);
  const rowHeight = Math.max(chartData.length, 1) * 32 + 16;

  return (
    <div className="space-y-4 min-w-0">
      <h4 className="font-bold text-sm text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-2">
        <FaFileInvoice className="text-green-500" />
        {t('stats.typesBreakdown')}
      </h4>

      {!ready ? (
        <ChartSkeleton height="h-40" />
      ) : chartData.length === 0 ? (
        <ChartFrame height="h-32" className="flex items-center justify-center">
          <EmptyState icon={<FaFileInvoice />} title={t('stats.noTypeData')} />
        </ChartFrame>
      ) : (
        <ChartFrame style={{ height: rowHeight }}>
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
                width={84}
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
              <Bar
                dataKey="count"
                radius={CHART_BAR_RADIUS_HORIZONTAL}
                maxBarSize={20}
                onClick={(data: BarRectangleItem) => {
                  const typeKey = (data.payload as { typeKey?: string } | undefined)?.typeKey ?? '';
                  setActiveFilter((prev) =>
                    prev?.type === 'type' && prev.value === typeKey ? null : { type: 'type', value: typeKey }
                  );
                }}
                style={{ cursor: 'pointer' }}
              >
                {chartData.map((entry) => {
                  const isOtherSelected = activeFilter?.type === 'type' && activeFilter.value !== entry.typeKey;
                  return <Cell key={entry.typeKey} fill={entry.color} fillOpacity={isOtherSelected ? 0.35 : 1} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartFrame>
      )}
    </div>
  );
}
