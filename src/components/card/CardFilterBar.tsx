import { Dispatch, SetStateAction } from 'react';
import { SearchFilters as SearchFiltersType } from '../../types';
import { useSearchFilters } from '../../hooks/useSearchFilters';
import { MANA_COLOR_GRADIENTS } from '../../constants/manaColors';

interface CardFilterBarProps {
  filters: SearchFiltersType;
  setFilters: Dispatch<SetStateAction<SearchFiltersType>>;
}

export default function CardFilterBar({ filters, setFilters }: CardFilterBarProps) {
  const { colors, types, toggleColor, toggleType } = useSearchFilters(filters, setFilters);

  // Mana color classes
  const getManaColorClass = (code: string, isActive: boolean) => {
    const base =
      'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm cursor-pointer transition-all duration-300 transform';

    if (!isActive)
      return `${base} bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-400 border border-gray-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm hover:scale-110`;

    return `${base} ${MANA_COLOR_GRADIENTS[code] ?? ''}`;
  };

  return (
    <div className="flex flex-wrap items-center gap-3 sm:gap-4 py-2 sm:py-4 w-full">
      {/* Colors */}
      <div className="flex items-center gap-2">
        {colors.map((color: { code: string; name: string }) => (
          <button
            key={color.code}
            type="button"
            onClick={() => toggleColor(color.code)}
            className={getManaColorClass(color.code, filters.colors.includes(color.code))}
            title={color.name}
            aria-pressed={filters.colors.includes(color.code)}
          >
            {color.code}
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-200 dark:bg-slate-700 mx-1 hidden sm:block"></div>

      {/* Types */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar flex-1 mask-linear-fade">
        {types.map((type: { code: string; name: string }) => {
          const isActive = filters.types.includes(type.code);
          return (
            <button
              key={type.code}
              onClick={() => toggleType(type.code)}
              className={`px-4 py-1.5 rounded-full text-[11px] font-bold tracking-wide whitespace-nowrap transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-primary border-transparent text-white shadow-md shadow-blue-500/25 scale-[1.02]'
                  : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 hover:border-gray-300 dark:hover:border-slate-600 shadow-sm hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {type.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
