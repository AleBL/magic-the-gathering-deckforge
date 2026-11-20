import { CSSProperties, DependencyList, ReactNode, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Shared chart chrome for the deck-statistics panels: one card frame, one
 * tooltip, one legend, one loading skeleton — reused by every panel so
 * radius/spacing/typography stay identical across the set.
 */

/** Card frame wrapping a chart's plot area. Same radius/border/bg as every other panel. */
export function ChartFrame({
  height = '',
  className = '',
  style,
  children
}: {
  height?: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <div
      className={`w-full ${height} rounded-xl border border-line bg-surface-1/50 shadow-inner p-2 relative ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}

/** Bar-shaped loading placeholder, sized to match a panel's real chart frame. */
export function ChartSkeleton({ height }: { height: string }) {
  const { t } = useTranslation();
  const bars = [55, 80, 45, 90, 60, 75, 50];
  return (
    <div
      className={`w-full ${height} rounded-xl border border-line bg-surface-2/50 animate-pulse overflow-hidden relative`}
      role="status"
      aria-label={t('common.loading')}
    >
      <div className="absolute inset-0 flex items-end justify-between gap-2 p-4">
        {bars.map((h, i) => (
          <div key={i} className="flex-1 rounded-t bg-surface-3/60" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  );
}

/**
 * True one animation frame after `deps` last changed. Recharts'
 * ResponsiveContainer needs a measured parent before it can paint, so
 * panels show `ChartSkeleton` for that first frame instead of a blank/empty
 * flash — the only "loading" boundary this app has, since stats are
 * computed synchronously.
 */
export function useChartReady(deps: DependencyList): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(false);
    const raf = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return ready;
}

export interface ChartTooltipRow {
  key: string;
  label: ReactNode;
  value: ReactNode;
  swatch?: string;
}

interface ChartTooltipProps {
  active?: boolean;
  title?: ReactNode;
  rows: ChartTooltipRow[];
}

/** Standardized tooltip card: same type scale, radius, and surfaces (light/dark) everywhere. */
export function ChartTooltip({ active, title, rows }: ChartTooltipProps) {
  if (!active || rows.length === 0) return null;
  return (
    <div
      role="tooltip"
      className="bg-surface-1 text-fg text-xs p-3 rounded-lg shadow-xl border border-line min-w-[9rem]"
    >
      {title ? (
        <div className="flex items-center gap-2 mb-1.5 pb-1.5 border-b border-line font-semibold text-fg">{title}</div>
      ) : null}
      <div className="flex flex-col gap-1">
        {rows.map((row) => (
          <div key={row.key} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-fg-muted font-medium">
              {row.swatch ? (
                <span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ backgroundColor: row.swatch }} />
              ) : null}
              {row.label}
            </span>
            <span className="font-semibold text-fg tabular-nums">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export interface ChartLegendItem {
  key: string;
  label: ReactNode;
  swatch: string;
  value?: ReactNode;
  active?: boolean;
  muted?: boolean;
  onClick?: () => void;
}

/** Row of legend pills. Identity is always icon/label + swatch, never the swatch alone. */
export function ChartLegend({ items }: { items: ChartLegendItem[] }) {
  return (
    <div className="flex flex-wrap gap-2" role="list">
      {items.map((item) => {
        const Tag = item.onClick ? 'button' : 'div';
        return (
          <Tag
            key={item.key}
            role="listitem"
            type={item.onClick ? 'button' : undefined}
            onClick={item.onClick}
            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all flex items-center gap-1.5 ${
              item.active
                ? 'ring-2 ring-focus ring-offset-1 dark:ring-offset-slate-900 shadow-md border-transparent'
                : 'border-line '
            } ${item.muted ? 'opacity-40' : 'opacity-90 hover:opacity-100'} ${item.onClick ? 'cursor-pointer' : ''}`}
          >
            <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0" style={{ backgroundColor: item.swatch }} />
            <span className="flex items-center gap-1 text-fg-secondary">{item.label}</span>
            {item.value !== undefined ? (
              <span className="text-fg-muted font-normal tabular-nums">{item.value}</span>
            ) : null}
          </Tag>
        );
      })}
    </div>
  );
}
