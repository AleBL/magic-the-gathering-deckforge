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
import { FaChartBar } from 'react-icons/fa';
import { DeckStatistics, StatFilter } from '../../utils/deckStatistics';
import { CHART_BAR_RADIUS_VERTICAL, CHART_SEQUENTIAL, CHART_TICK_STYLE } from './chartTheme';
import { ChartFrame, ChartSkeleton, ChartTooltip, useChartReady } from './ChartPrimitives';
import EmptyState from '../ui/EmptyState';

interface ManaCurvePanelProps {
  stats: DeckStatistics;
  activeFilter: StatFilter | null;
  setActiveFilter: Dispatch<SetStateAction<StatFilter | null>>;
}

const BAR_COLOR = CHART_SEQUENTIAL[1];
const BAR_COLOR_ACTIVE = CHART_SEQUENTIAL[3];

export function ManaCurvePanel({ stats, activeFilter, setActiveFilter }: ManaCurvePanelProps) {
  const { t } = useTranslation();

  const chartData = useMemo(
    () => Object.entries(stats.convertedManaCostCounts).map(([cmc, count]) => ({ cmc, count })),
    [stats.convertedManaCostCounts]
  );
  const totalSpells = chartData.reduce((sum, d) => sum + d.count, 0);
  const ready = useChartReady([chartData]);

  return (
    <div className="space-y-4 min-w-0">
      <h4 className="font-bold text-sm text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-2">
        <FaChartBar className="text-blue-500" />
        {t('stats.manaCurve')}
      </h4>

      {!ready ? (
        <ChartSkeleton height="h-40" />
      ) : totalSpells === 0 ? (
        <ChartFrame height="h-64 sm:h-72" className="flex items-center justify-center">
          <EmptyState icon={<FaChartBar />} title={t('stats.noCurveData')} />
        </ChartFrame>
      ) : (
        <ChartFrame height="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 4, left: 4, bottom: 0 }} barCategoryGap="20%">
              <XAxis dataKey="cmc" tick={CHART_TICK_STYLE} tickLine={false} axisLine={false} />
              <YAxis hide />
              <RechartsTooltip
                cursor={{ fill: 'var(--chart-grid)', opacity: 0.4 }}
                content={({ active, payload }) => {
                  const d = payload?.[0]?.payload as { cmc: string; count: number } | undefined;
                  if (!d) return null;
                  return (
                    <ChartTooltip
                      active={active}
                      title={`${t('stats.manaCurve')} ${d.cmc}`}
                      rows={[{ key: 'count', label: t('common.cards'), value: d.count, swatch: BAR_COLOR_ACTIVE }]}
                    />
                  );
                }}
              />
              <Bar
                dataKey="count"
                radius={CHART_BAR_RADIUS_VERTICAL}
                maxBarSize={36}
                onClick={(data: BarRectangleItem) => {
                  const cmc = (data.payload as { cmc?: string } | undefined)?.cmc ?? '';
                  setActiveFilter((prev) =>
                    prev?.type === 'cmc' && prev.value === cmc ? null : { type: 'cmc', value: cmc }
                  );
                }}
                style={{ cursor: 'pointer' }}
              >
                {chartData.map((entry) => {
                  const isSelected = activeFilter?.type === 'cmc' && activeFilter.value === entry.cmc;
                  const isOtherSelected = activeFilter?.type === 'cmc' && activeFilter.value !== entry.cmc;
                  return (
                    <Cell
                      key={entry.cmc}
                      fill={isSelected ? BAR_COLOR_ACTIVE : BAR_COLOR}
                      fillOpacity={isOtherSelected ? 0.35 : 1}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartFrame>
      )}

      <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
        {t('stats.averageCmc')}:{' '}
        <span className="font-bold text-gray-800 dark:text-gray-200 tabular-nums">
          {stats.averageConvertedManaCost}
        </span>
      </div>
    </div>
  );
}
