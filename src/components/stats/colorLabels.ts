import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export interface ColorLabel {
  name: string;
  fill: string;
  color: string;
}

/** Presentational metadata (label + swatch classes) for each mana color, translated. */
export function useColorLabels(): Record<string, ColorLabel> {
  const { t } = useTranslation();

  return useMemo(
    () => ({
      W: {
        name: t('search.white'),
        fill: 'bg-slate-200',
        color: 'text-fg bg-surface-2 border-line-strong'
      },
      U: {
        name: t('search.blue'),
        fill: 'bg-blue-400',
        color: 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-800'
      },
      B: {
        name: t('search.black'),
        fill: 'bg-zinc-800',
        color: 'text-fg bg-surface-3 border-zinc-500 dark:border-zinc-700'
      },
      R: {
        name: t('search.red'),
        fill: 'bg-red-500',
        color: 'text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-800'
      },
      G: {
        name: t('search.green'),
        fill: 'bg-green-500',
        color:
          'text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-800'
      },
      C: {
        name: t('search.colorless'),
        fill: 'bg-slate-400',
        color: 'text-fg-secondary bg-surface-2 border-line'
      }
    }),
    [t]
  );
}
