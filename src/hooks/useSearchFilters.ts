import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { SearchFilters as SearchFiltersType } from '../types';
import { EMPTY_SEARCH_FILTERS } from '../constants';

export function useSearchFilters(
  filters: SearchFiltersType,
  setFilters: React.Dispatch<React.SetStateAction<SearchFiltersType>>
) {
  const { t } = useTranslation();

  const colors = useMemo(
    () => [
      {
        code: 'W',
        name: t('search.white'),
        activeClasses:
          'bg-yellow-100 text-yellow-900 shadow-md ring-2 ring-yellow-400 dark:bg-yellow-900 dark:text-yellow-100 dark:ring-yellow-500'
      },
      {
        code: 'U',
        name: t('search.blue'),
        activeClasses: 'bg-blue-500 text-white shadow-md ring-2 ring-blue-400 dark:bg-blue-600 dark:ring-blue-500'
      },
      {
        code: 'B',
        name: t('search.black'),
        activeClasses: 'bg-gray-800 text-white shadow-md ring-2 ring-gray-400 dark:bg-black dark:ring-gray-600'
      },
      {
        code: 'R',
        name: t('search.red'),
        activeClasses: 'bg-red-600 text-white shadow-md ring-2 ring-red-400 dark:bg-red-700 dark:ring-red-500'
      },
      {
        code: 'G',
        name: t('search.green'),
        activeClasses: 'bg-green-600 text-white shadow-md ring-2 ring-green-400 dark:bg-green-700 dark:ring-green-500'
      }
    ],
    [t]
  );

  const types = useMemo(
    () => [
      { code: 'Creature', name: t('search.creature') },
      { code: 'Instant', name: t('search.instant') },
      { code: 'Sorcery', name: t('search.sorcery') },
      { code: 'Enchantment', name: t('search.enchantment') },
      { code: 'Artifact', name: t('search.artifact') },
      { code: 'Planeswalker', name: t('search.planeswalker') },
      { code: 'Land', name: t('search.land') }
    ],
    [t]
  );

  const rarities = useMemo(
    () => [
      { value: '', label: t('search.all') },
      { value: 'common', label: t('search.common') },
      { value: 'uncommon', label: t('search.uncommon') },
      { value: 'rare', label: t('search.rare') },
      { value: 'mythic', label: t('search.mythic') }
    ],
    [t]
  );

  const toggleColor = useCallback(
    (colorCode: string) => {
      setFilters((prev) => ({
        ...prev,
        colors: prev.colors.includes(colorCode)
          ? prev.colors.filter((color) => color !== colorCode)
          : [...prev.colors, colorCode]
      }));
    },
    [setFilters]
  );

  const toggleType = useCallback(
    (type: string) => {
      setFilters((prev) => ({
        ...prev,
        types: prev.types.includes(type) ? prev.types.filter((typeCode) => typeCode !== type) : [...prev.types, type]
      }));
    },
    [setFilters]
  );

  const clearFilters = useCallback(() => {
    setFilters(EMPTY_SEARCH_FILTERS);
  }, [setFilters]);

  const setRarity = useCallback(
    (rarity: string) => {
      setFilters((prev) => ({ ...prev, rarity }));
    },
    [setFilters]
  );

  const setCmc = useCallback(
    (cmc: string) => {
      setFilters((prev) => ({ ...prev, cmc }));
    },
    [setFilters]
  );

  return {
    colors,
    types,
    rarities,
    toggleColor,
    toggleType,
    clearFilters,
    setRarity,
    setCmc
  };
}
