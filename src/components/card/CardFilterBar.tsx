import { Dispatch, SetStateAction } from 'react';
import { SearchFilters as SearchFiltersType } from '../../types';
import { useSearchFilters } from '../../hooks/useSearchFilters';
import { getSymbolUrl } from '../../utils/symbolHelper';

interface CardFilterBarProps {
  filters: SearchFiltersType;
  setFilters: Dispatch<SetStateAction<SearchFiltersType>>;
  /**
   * Full-text, two-column layout for the mobile filters sheet: colors on the
   * left and types on the right, each stacked vertically with their complete
   * localized name — neither a swatch letter nor a hover title works on
   * touch, and a horizontal scroll strip hides most types off-screen with no
   * hint that there's more to swipe to.
   */
  mobileLayout?: boolean;
}

export default function CardFilterBar({ filters, setFilters, mobileLayout = false }: CardFilterBarProps) {
  const { colors, types, toggleColor, toggleType } = useSearchFilters(filters, setFilters);

  // Mana color classes (desktop swatch)
  // Mana symbols are the only coloured iconography in the app: a selected colour shows its
  // pip in full colour inside an ink ring, an unselected one is a grey pip. The ring and the
  // grey both read without colour vision.
  const pipClass = (isActive: boolean) =>
    `w-5 h-5 shrink-0 select-none transition-[filter,opacity] duration-150 ${isActive ? '' : 'grayscale opacity-50'}`;

  if (mobileLayout) {
    return (
      <div className="flex flex-row gap-3 py-2 w-full items-start">
        {/* Colors — left column */}
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          {colors.map((color: { code: string; name: string }) => {
            const isActive = filters.colors.includes(color.code);
            return (
              <button
                key={color.code}
                type="button"
                onClick={() => toggleColor(color.code)}
                aria-pressed={isActive}
                className={`flex items-center gap-2 w-full min-h-11 px-2.5 py-2 rounded-xl text-xs font-medium transition-colors duration-150 cursor-pointer border ${
                  isActive
                    ? 'bg-surface-3 text-fg border-line-strong'
                    : 'bg-surface-1 text-fg-secondary border-line hover:bg-surface-2'
                }`}
              >
                <img src={getSymbolUrl(`{${color.code}}`)} alt="" className={pipClass(isActive)} />
                <span className="truncate">{color.name}</span>
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="w-px self-stretch bg-surface-3" />

        {/* Types — right column */}
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          {types.map((type: { code: string; name: string }) => {
            const isActive = filters.types.includes(type.code);
            return (
              <button
                key={type.code}
                type="button"
                onClick={() => toggleType(type.code)}
                aria-pressed={isActive}
                className={`flex items-center w-full min-h-11 px-3 py-2 rounded-xl text-xs font-medium transition-colors duration-150 cursor-pointer truncate ${
                  isActive
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-1 text-fg-secondary border border-line hover:bg-surface-2'
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

  return (
    // Stacked on small screens (readable in the narrow editor pane); side by
    // side on large screens so the colors row doesn't waste the width beside it.
    <div className="flex flex-col lg:flex-row lg:items-start gap-2.5 lg:gap-4 py-2 sm:py-3 w-full">
      {/* Colors */}
      <div className="flex flex-wrap items-center gap-2 lg:shrink-0">
        {colors.map((color: { code: string; name: string }) => {
          const isActive = filters.colors.includes(color.code);
          return (
            <button
              key={color.code}
              type="button"
              onClick={() => toggleColor(color.code)}
              className={`w-9 h-9 rounded-full flex items-center justify-center cursor-pointer transition-colors duration-150 ${
                isActive
                  ? 'bg-surface-1 ring-2 ring-fg ring-offset-2 ring-offset-surface-0'
                  : 'bg-surface-2 border border-line hover:bg-surface-3'
              }`}
              title={color.name}
              aria-label={color.name}
              aria-pressed={isActive}
            >
              <img src={getSymbolUrl(`{${color.code}}`)} alt="" className={pipClass(isActive)} />
            </button>
          );
        })}
      </div>

      {/* Divider between colors and types on large screens. */}
      <div className="hidden lg:block w-px self-stretch bg-surface-3" />

      {/* Types — wrap onto multiple rows so every type stays visible instead of
          hiding behind an awkward horizontal scroll. */}
      <div className="flex flex-wrap items-center gap-2 lg:flex-1">
        {types.map((type: { code: string; name: string }) => {
          const isActive = filters.types.includes(type.code);
          return (
            <button
              key={type.code}
              onClick={() => toggleType(type.code)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors duration-150 cursor-pointer ${
                isActive
                  ? 'bg-primary border-transparent text-on-primary'
                  : 'bg-surface-1 text-fg-secondary border border-line hover:bg-surface-2 hover:text-fg'
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
