import { useState, Dispatch, SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import { SearchFilters as SearchFiltersType, EMPTY_SEARCH_FILTERS } from '../types';

interface SearchFiltersProps {
  filters: SearchFiltersType;
  setFilters: Dispatch<SetStateAction<SearchFiltersType>>;
}

function SearchFilters({ filters, setFilters }: SearchFiltersProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  const colors = [
    { code: 'W', name: t('white'), color: 'bg-yellow-100' },
    { code: 'U', name: t('blue'), color: 'bg-blue-500' },
    { code: 'B', name: t('black'), color: 'bg-gray-900' },
    { code: 'R', name: t('red'), color: 'bg-red-600' },
    { code: 'G', name: t('green'), color: 'bg-green-600' }
  ];

  const types = [
    { code: 'Creature', name: t('creature') },
    { code: 'Instant', name: t('instant') },
    { code: 'Sorcery', name: t('sorcery') },
    { code: 'Enchantment', name: t('enchantment') },
    { code: 'Artifact', name: t('artifact') },
    { code: 'Planeswalker', name: t('planeswalker') },
    { code: 'Land', name: t('land') }
  ];

  const rarities = [
    { value: '', label: t('all') },
    { value: 'common', label: t('common') },
    { value: 'uncommon', label: t('uncommon') },
    { value: 'rare', label: t('rare') },
    { value: 'mythic', label: t('mythic') }
  ];

  const toggleColor = (colorCode: string) => {
    setFilters((prev) => ({
      ...prev,
      colors: prev.colors.includes(colorCode) ? prev.colors.filter((c) => c !== colorCode) : [...prev.colors, colorCode]
    }));
  };

  const toggleType = (type: string) => {
    setFilters((prev) => ({
      ...prev,
      types: prev.types.includes(type) ? prev.types.filter((typeCode) => typeCode !== type) : [...prev.types, type]
    }));
  };

  const clearFilters = () => {
    setFilters(EMPTY_SEARCH_FILTERS);
  };

  return (
    <div className="filters-panel">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="filters-trigger"
      >
        <span className="font-semibold">{t('advancedFilters')}</span>
        <span className="text-xl">{isExpanded ? '−' : '+'}</span>
      </button>

      {isExpanded && (
        <div className="filters-content">
          <div>
            <span className="filters-section-title">
              {t('colors')}
            </span>
            <div className="flex gap-2 flex-wrap">
              {colors.map((color) => (
                <button
                  key={color.code}
                  onClick={() => toggleColor(color.code)}
                  className={`filter-badge-button ${
                    filters.colors.includes(color.code)
                      ? `${color.color} text-white shadow-md ring-2 ring-blue-500`
                      : ''
                  }`}
                >
                  {color.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="filters-section-title">
              {t('types')}
            </span>
            <div className="flex gap-2 flex-wrap">
              {types.map((type) => (
                <button
                  key={type.code}
                  onClick={() => toggleType(type.code)}
                  className={`filter-badge-button ${
                    filters.types.includes(type.code) ? 'filter-badge-button-active' : ''
                  }`}
                >
                  {type.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="filter-rarity"
              className="form-label mb-2"
            >
              {t('rarity')}
            </label>
            <select
              id="filter-rarity"
              value={filters.rarity}
              onChange={(e) => setFilters((prev) => ({ ...prev, rarity: e.target.value }))}
              className="form-select"
            >
              {rarities.map((rarity) => (
                <option key={rarity.value} value={rarity.value}>
                  {rarity.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="filter-cmc"
              className="form-label mb-2"
            >
              {t('cmc')}
            </label>
            <input
              id="filter-cmc"
              type="number"
              value={filters.cmc}
              onChange={(e) => setFilters((prev) => ({ ...prev, cmc: e.target.value }))}
              placeholder={t('cmcPlaceholder')}
              className="form-input"
            />
          </div>

          <button
            onClick={clearFilters}
            className="danger-button w-full"
          >
            {t('clearFilters')}
          </button>
        </div>
      )}
    </div>
  );
}

export default SearchFilters;
