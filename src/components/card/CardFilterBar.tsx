import { Dispatch, SetStateAction } from 'react';
import { SearchFilters as SearchFiltersType } from '../../types';
import { useSearchFilters } from '../../hooks/useSearchFilters';

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
      return `${base} bg-gray-100 text-gray-400 dark:bg-slate-800 dark:text-slate-500 border border-gray-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm hover:scale-110`;

    switch (code) {
      case 'W':
        return `${base} bg-gradient-to-br from-[#fff7de] to-[#f8e7b9] text-[#80724b] ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 ring-[#f8e7b9] shadow-lg scale-110 z-10`;
      case 'U':
        return `${base} bg-gradient-to-br from-[#1a7bc4] to-[#0e68ab] text-white ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 ring-[#0e68ab] shadow-lg scale-110 z-10`;
      case 'B':
        return `${base} bg-gradient-to-br from-[#2a1600] to-[#150b00] text-[#c0b3a3] ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 ring-[#150b00] shadow-lg scale-110 z-10`;
      case 'R':
        return `${base} bg-gradient-to-br from-[#e63c45] to-[#d3202a] text-white ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 ring-[#d3202a] shadow-lg scale-110 z-10`;
      case 'G':
        return `${base} bg-gradient-to-br from-[#008f4d] to-[#00733e] text-white ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 ring-[#00733e] shadow-lg scale-110 z-10`;
      default:
        return base;
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-4 py-4 w-full">
      {/* Colors */}
      <div className="flex items-center gap-2">
        {colors.map((color: { code: string; name: string; activeClasses: string }) => (
          <div
            key={color.code}
            onClick={() => toggleColor(color.code)}
            className={getManaColorClass(color.code, filters.colors.includes(color.code))}
            title={color.name}
          >
            {color.code}
          </div>
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
                  ? 'bg-blue-600 border-transparent text-white shadow-md shadow-blue-500/25 scale-[1.02]'
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
