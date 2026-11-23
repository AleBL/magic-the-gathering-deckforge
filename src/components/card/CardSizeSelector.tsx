import { useTranslation } from 'react-i18next';
import { CardSize } from '../../types';
import { CARD_SIZES } from '../../constants';

interface CardSizeSelectorProps {
  selectedSize: CardSize;
  onSizeChange: (size: CardSize) => void;
}

function CardSizeSelector({ selectedSize, onSizeChange }: CardSizeSelectorProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-row items-center gap-2 sm:gap-4 w-auto" role="radiogroup">
      <span
        className="hidden sm:inline text-fg-secondary text-sm transition-colors duration-300 font-semibold whitespace-nowrap"
        aria-hidden="true"
      >
        {t('search.cardSize')}
      </span>
      <div className="flex bg-surface-2 p-1 rounded-xl border border-line w-auto">
        {CARD_SIZES.map((size) => (
          <button
            key={size}
            type="button"
            role="radio"
            aria-checked={selectedSize === size}
            aria-label={t(`search.${size}`)}
            title={t(`search.${size}`)}
            onClick={() => onSizeChange(size)}
            className={`flex-1 sm:flex-none min-h-[44px] sm:min-h-0 text-center px-3 sm:px-4 py-1.5 text-xs font-medium rounded-lg transition-colors duration-150 ${
              selectedSize === size ? 'bg-surface-1 text-fg shadow-xs ring-1 ring-line' : 'text-fg-muted hover:text-fg'
            }`}
          >
            {t(`search.${size}Initial`)}
          </button>
        ))}
      </div>
    </div>
  );
}

export default CardSizeSelector;
