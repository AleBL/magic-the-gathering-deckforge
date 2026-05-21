import { useTranslation } from 'react-i18next';
import { CardSize, CARD_SIZES } from '../types';

interface CardSizeSelectorProps {
  selectedSize: CardSize;
  onSizeChange: (size: CardSize) => void;
}

function CardSizeSelector({ selectedSize, onSizeChange }: CardSizeSelectorProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-4">
      <span className="text-gray-700 dark:text-white text-sm transition-colors duration-300 font-medium">
        {t('cardSize')}
      </span>
      <div className="selector-group">
        {CARD_SIZES.map((size) => (
          <button
            key={size}
            type="button"
            onClick={() => onSizeChange(size)}
            className={`selector-button ${selectedSize === size ? 'selector-button-active' : ''}`}
          >
            {t(size === 'xlarge' ? 'extraLarge' : size)}
          </button>
        ))}
      </div>
    </div>
  );
}

export default CardSizeSelector;
