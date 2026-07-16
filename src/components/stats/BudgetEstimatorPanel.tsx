import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Bar, BarChart, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from 'recharts';
import { FaCoins, FaStar } from 'react-icons/fa';
import { DeckStatistics } from '../../utils/deckStatistics';
import { CHART_BAR_RADIUS_HORIZONTAL, CHART_SEQUENTIAL, CHART_TICK_STYLE } from './chartTheme';
import { ChartFrame, ChartSkeleton, ChartTooltip, useChartReady } from './ChartPrimitives';

interface BudgetEstimatorPanelProps {
  stats: DeckStatistics;
}

const BAR_COLOR = CHART_SEQUENTIAL[2];

export function BudgetEstimatorPanel({ stats }: BudgetEstimatorPanelProps) {
  const { t } = useTranslation();

  const chartData = useMemo(
    () =>
      stats.mostExpensiveCards.map((card) => ({
        id: card.id,
        name: card.printed_name || card.name,
        price: parseFloat(card.prices?.usd || '0')
      })),
    [stats.mostExpensiveCards]
  );
  const ready = useChartReady([chartData]);
  const rowHeight = Math.max(chartData.length, 1) * 32 + 16;

  return (
    <div className="space-y-4 p-4 rounded-xl border border-purple-200 dark:border-purple-900 bg-purple-500/5 dark:bg-purple-950/10 transition-colors duration-300">
      <h4 className="font-bold text-sm text-purple-700 dark:text-purple-400 uppercase tracking-wider flex items-center gap-2">
        <FaCoins className="text-purple-500" />
        {t('stats.budgetEstimator')}
      </h4>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/80 dark:bg-gray-850/80 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <span className="text-[9px] uppercase tracking-wider text-gray-400 block font-bold">
            {t('stats.totalUsd')}
          </span>
          <span className="text-base font-extrabold text-purple-600 dark:text-purple-400 tabular-nums">
            ${stats.totalUsdPrice.toFixed(2)}
          </span>
        </div>
        <div className="bg-white/80 dark:bg-gray-850/80 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <span className="text-[9px] uppercase tracking-wider text-gray-400 block font-bold">
            {t('stats.totalEur')}
          </span>
          <span className="text-base font-extrabold text-purple-600 dark:text-purple-400 tabular-nums">
            €{stats.totalEurPrice.toFixed(2)}
          </span>
        </div>
      </div>

      {!ready ? (
        <ChartSkeleton height="h-32" />
      ) : chartData.length > 0 ? (
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1">
            <FaStar className="text-amber-500" />
            {t('stats.topExpensiveCards')}
          </span>
          <ChartFrame style={{ height: rowHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 4, right: 12, left: 4, bottom: 4 }}
                barCategoryGap="24%"
              >
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={CHART_TICK_STYLE}
                  tickLine={false}
                  axisLine={false}
                  width={100}
                  tickFormatter={(name: string) => (name.length > 14 ? `${name.slice(0, 13)}…` : name)}
                />
                <RechartsTooltip
                  cursor={{ fill: 'var(--chart-grid)', opacity: 0.4 }}
                  content={({ active, payload }) => {
                    const d = payload?.[0]?.payload as { name: string; price: number } | undefined;
                    if (!d) return null;
                    return (
                      <ChartTooltip
                        active={active}
                        title={d.name}
                        rows={[
                          { key: 'price', label: t('stats.prices'), value: `$${d.price.toFixed(2)}`, swatch: BAR_COLOR }
                        ]}
                      />
                    );
                  }}
                />
                <Bar dataKey="price" fill={BAR_COLOR} radius={CHART_BAR_RADIUS_HORIZONTAL} maxBarSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </ChartFrame>
        </div>
      ) : null}
    </div>
  );
}
