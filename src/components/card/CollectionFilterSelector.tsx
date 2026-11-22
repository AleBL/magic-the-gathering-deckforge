import { useTranslation } from 'react-i18next';
import { OwnershipFilter } from '../../hooks/useCollectionOwnership';

interface CollectionFilterSelectorProps {
  value: OwnershipFilter;
  onChange: (value: OwnershipFilter) => void;
}

const OPTIONS: { value: OwnershipFilter; labelKey: string }[] = [
  { value: 'all', labelKey: 'search.ownershipAll' },
  { value: 'owned', labelKey: 'search.ownershipOwned' },
  { value: 'missing', labelKey: 'search.ownershipMissing' }
];

/** Narrows search results by ownership. A radiogroup: the options are mutually exclusive. */
function CollectionFilterSelector({ value, onChange }: CollectionFilterSelectorProps) {
  const { t } = useTranslation();

  return (
    <div
      role="radiogroup"
      aria-label={t('search.ownership')}
      className="flex items-center gap-1 rounded-xl bg-surface-2 p-1"
    >
      {OPTIONS.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(option.value)}
            className={`min-h-[36px] px-3 rounded-lg text-xs font-bold transition-all ${
              isActive
                ? 'bg-white dark:bg-slate-600 text-accent shadow-sm ring-1 ring-line '
                : 'text-fg-secondary hover:text-fg '
            }`}
          >
            {t(option.labelKey)}
          </button>
        );
      })}
    </div>
  );
}

export default CollectionFilterSelector;
