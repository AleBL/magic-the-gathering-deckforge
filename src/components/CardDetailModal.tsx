import { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Card } from '../types/Card';
import { parseTextWithSymbols } from '../utils/symbolHelper';

interface CardDetailModalProps {
  card: Card;
  imageUrl: string;
  onAddToDeck?: (card: Card) => void;
  onClose: () => void;
}

function CardDetailModal({ card, imageUrl, onAddToDeck, onClose }: CardDetailModalProps) {
  const { t } = useTranslation();

  return createPortal(
    <div
      className="modal-overlay"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          onClose();
        }
      }}
      role="button"
      tabIndex={-1}
      aria-label={t('close')}
    >
      <div
        className="modal-container modal-container-large"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-card-title"
      >
        <div className="flex flex-col md:flex-row gap-6">
          <div className="card-detail-image-wrapper">
            <img
              src={imageUrl}
              alt={card.name}
              className="card-detail-image"
            />
          </div>
          <div className="card-detail-info">
            <h2 id="modal-card-title" className="text-2xl font-bold">
              {card.printed_name || card.name}
            </h2>
            <p className="text-gray-700 dark:text-gray-300 transition-colors duration-300">
              {card.printed_type_line || card.type_line}
            </p>
            {card.mana_cost && (
              <p className="text-yellow-600 dark:text-yellow-400 transition-colors duration-300 flex items-center flex-wrap gap-1">
                {t('manaCostLabel')}: {parseTextWithSymbols(card.mana_cost, true)}
              </p>
            )}
            {(card.printed_text || card.oracle_text) && (
              <div>
                <h3 className="font-semibold mb-1">{t('textLabel')}:</h3>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line transition-colors duration-300 leading-relaxed">
                  {parseTextWithSymbols(card.printed_text || card.oracle_text)}
                </p>
              </div>
            )}
            {card.power && card.toughness && (
              <p className="text-green-600 dark:text-green-400 transition-colors duration-300">
                {t('powerToughnessLabel')}: {card.power}/{card.toughness}
              </p>
            )}
            <p className="text-gray-600 dark:text-gray-400 transition-colors duration-300">
              {t('rarityLabel')}: {card.rarity}
            </p>
            <p className="text-gray-600 dark:text-gray-400 transition-colors duration-300">
              {t('setLabel')}: {card.set_name}
            </p>
            <div className="modal-actions">
              {onAddToDeck && (
                <button
                  onClick={() => {
                    onAddToDeck(card);
                    onClose();
                  }}
                  className="success-button"
                >
                  {t('addToDeck')}
                </button>
              )}
              <button
                onClick={onClose}
                className="secondary-button"
              >
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  ) as unknown as ReactNode;
}

export default CardDetailModal;
