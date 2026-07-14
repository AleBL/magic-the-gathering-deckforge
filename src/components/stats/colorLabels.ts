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
        color:
          'text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-800/50 border-slate-300 dark:border-slate-600'
      },
      U: {
        name: t('search.blue'),
        fill: 'bg-blue-400',
        color: 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-800'
      },
      B: {
        name: t('search.black'),
        fill: 'bg-zinc-800',
        color: 'text-zinc-900 dark:text-zinc-300 bg-zinc-300 dark:bg-zinc-900/80 border-zinc-500 dark:border-zinc-700'
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
        color:
          'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/20 border-slate-200 dark:border-slate-800/50'
      }
    }),
    [t]
  );
}
