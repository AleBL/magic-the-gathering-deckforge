import { Dispatch, SetStateAction, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { FaPalette } from 'react-icons/fa';
import { parseTextWithSymbols } from '../../utils/symbolHelper';
import { DeckStatistics, StatFilter } from '../../utils/deckStatistics';
import { ColorLabel } from './colorLabels';
import { MANA_CHART_COLOR, ManaColorKey, CHART_SEGMENT_GAP } from './chartTheme';
import { ChartFrame, ChartLegend, ChartSkeleton, ChartTooltip, useChartReady } from './ChartPrimitives';
import EmptyState from '../ui/EmptyState';

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

    // All six mana kinds, including true colorless ({C}) — a colorless deck's
    // identity must show up here, not vanish from the chart.
    const validColors = Object.entries(stats.colorDistributionCounts);
    const maxCount = Math.max(...validColors.map(([, count]) => count), 1);
    const totalValidColors = validColors.reduce((sum, [, count]) => sum + count, 0);

    return validColors.map(([colorKey, count]) => {
      const meta = colorLabels[colorKey];
      const pct = count > 0 && totalValidColors > 0 ? ((count / totalValidColors) * 100).toFixed(0) : '0';

      return {
        subject: meta.name,
        A: count,
        pct,
        fullMark: maxCount,
        colorKey,
        meta,
        hexColor: MANA_CHART_COLOR[colorKey as ManaColorKey]
      };
    });
  }, [stats, colorLabels]);

  const ready = useChartReady([chartData]);
  const hasData = chartData.some((d) => d.A > 0);

  return (
    <div className="space-y-4 relative z-10 min-w-0">
      <h4 className="font-bold text-sm text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-2">
        <FaPalette className="text-purple-500" />
        {t('stats.colorsDistribution')}
      </h4>

      {!ready ? (
        <ChartSkeleton height="h-64 sm:h-72" />
      ) : hasData ? (
        <ChartFrame height="h-64 sm:h-72" className="z-20">
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
                      stroke={isSelected ? 'var(--chart-text-primary)' : CHART_SEGMENT_GAP.stroke}
                      strokeWidth={isSelected ? 3 : CHART_SEGMENT_GAP.strokeWidth}
                      style={{ outline: 'none', cursor: 'pointer', transition: 'all 0.3s ease' }}
                    />
                  );
                })}
              </Pie>
              <RechartsTooltip
                content={({ active, payload }) => {
                  const data = payload?.[0]?.payload;
                  if (!data) return null;
                  return (
                    <ChartTooltip
                      active={active}
                      title={
                        <>
                          <span className="flex items-center shadow-sm">
                            {parseTextWithSymbols(`{${data.colorKey}}`)}
                          </span>
                          {data.subject}
                        </>
                      }
                      rows={[
                        { key: 'cards', label: t('common.cards'), value: data.A },
                        { key: 'pct', label: t('stats.percentage'), value: `${data.pct}%` }
                      ]}
                    />
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartFrame>
      ) : (
        <ChartFrame height="h-64 sm:h-72" className="flex items-center justify-center">
          <EmptyState icon={<FaPalette />} title={t('export.noColorData')} />
        </ChartFrame>
      )}

      {hasData ? (
        <ChartLegend
          items={chartData
            .filter((d) => d.A > 0)
            .map((data) => ({
              key: data.colorKey,
              swatch: data.hexColor,
              label: (
                <>
                  <span className="flex items-center shadow-sm">{parseTextWithSymbols(`{${data.colorKey}}`)}</span>
                  {data.subject}
                </>
              ),
              value: data.A,
              active: activeFilter?.type === 'color' && activeFilter.value === data.colorKey,
              muted: activeFilter?.type === 'color' && activeFilter.value !== data.colorKey,
              onClick: () =>
                setActiveFilter((prev) =>
                  prev?.type === 'color' && prev.value === data.colorKey
                    ? null
                    : { type: 'color', value: data.colorKey }
                )
            }))}
        />
      ) : null}
    </div>
  );
}
