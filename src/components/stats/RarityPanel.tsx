import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Bar, BarChart, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from 'recharts';
import { FaGem } from 'react-icons/fa';
import { DeckStatistics } from '../../utils/deckStatistics';
import { CHART_SEGMENT_GAP, CHART_SEQUENTIAL } from './chartTheme';
import { ChartFrame, ChartLegend, ChartSkeleton, ChartTooltip, useChartReady } from './ChartPrimitives';
import EmptyState from '../ui/EmptyState';

interface RarityPanelProps {
  stats: DeckStatistics;
}

/** Ordinal tier order (common -> mythic), each mapped to a step of the sequential ramp. */
const RARITY_TIERS: { key: string; labelKey: string; step: number }[] = [
  { key: 'common', labelKey: 'stats.rarityCommon', step: 0 },
  { key: 'uncommon', labelKey: 'stats.rarityUncommon', step: 1 },
  { key: 'rare', labelKey: 'stats.rarityRare', step: 2 },
  { key: 'mythic', labelKey: 'stats.rarityMythic', step: 3 }
];

/** Distribution of the deck's cards by Scryfall rarity. */
export function RarityPanel({ stats }: RarityPanelProps) {
  const { t } = useTranslation();

  const entries = useMemo(
    () =>
      RARITY_TIERS.map((tier) => ({ ...tier, count: stats.rarityCounts[tier.key] || 0 })).filter((d) => d.count > 0),
    [stats.rarityCounts]
  );
  const total = entries.reduce((sum, d) => sum + d.count, 0);
  const ready = useChartReady([entries]);

  const chartData = useMemo(
    () => [entries.reduce((row, d) => ({ ...row, [d.key]: d.count }), { name: 'rarity' } as Record<string, unknown>)],
    [entries]
  );

  return (
    <div className="space-y-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-500/5 dark:bg-slate-900/20 transition-colors duration-300">
      <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
        <FaGem className="text-sky-500" />
        {t('stats.rarityBreakdown')}
      </h4>

      {!ready ? (
        <ChartSkeleton height="h-8" />
      ) : total === 0 ? (
        <ChartFrame height="h-16" className="flex items-center justify-center">
          <EmptyState icon={<FaGem />} title={t('stats.noRarityData')} />
        </ChartFrame>
      ) : (
        <ChartFrame height="h-8" className="p-0 overflow-hidden">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <XAxis type="number" hide domain={[0, total]} />
              <YAxis type="category" dataKey="name" hide />
              <RechartsTooltip
                cursor={false}
                content={({ active }) => (
                  <ChartTooltip
                    active={active}
                    rows={entries.map((d) => ({
                      key: d.key,
                      label: t(d.labelKey),
                      value: `${d.count} (${((d.count / total) * 100).toFixed(0)}%)`,
                      swatch: CHART_SEQUENTIAL[d.step]
                    }))}
                  />
                )}
              />
              {entries.map((d) => (
                <Bar
                  key={d.key}
                  dataKey={d.key}
                  stackId="rarity"
                  fill={CHART_SEQUENTIAL[d.step]}
                  stroke={CHART_SEGMENT_GAP.stroke}
                  strokeWidth={CHART_SEGMENT_GAP.strokeWidth}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </ChartFrame>
      )}

      {total > 0 ? (
        <ChartLegend
          items={entries.map((d) => ({
            key: d.key,
            label: t(d.labelKey),
            swatch: CHART_SEQUENTIAL[d.step],
            value: `${d.count} (${((d.count / total) * 100).toFixed(0)}%)`
          }))}
        />
      ) : null}
    </div>
  );
}
