import { useTranslation } from 'react-i18next';
import { FaExternalLinkAlt } from 'react-icons/fa';
import { Card } from '../../types/Card';
import { GATHERER_FAVICON_URL, SCRYFALL_FAVICON_URL } from '../../constants/urls';

interface CardDetailActionsProps {
  card: Card;
  isDeckCard: boolean;
  isToken: boolean;
  onAddCardToDeck?: () => void;
}

export function CardDetailActions({ card, isDeckCard, isToken, onAddCardToDeck }: CardDetailActionsProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-row items-center justify-between w-full mt-auto pt-4 md:pt-6 border-t border-line">
      <div className="flex gap-2">
        <a
          href={card.scryfall_uri}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-900/50 transition-colors border border-purple-100 dark:border-purple-800/50"
          title={t('export.scryfall')}
        >
          <img
            src={SCRYFALL_FAVICON_URL}
            alt={t('export.scryfall')}
            className="w-3 h-3 opacity-70"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
          {t('export.scryfall')}
          <FaExternalLinkAlt className="text-[9px] opacity-60" />
        </a>
        {card.related_uris?.gatherer && (
          <a
            href={card.related_uris.gatherer}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-2 text-fg-secondary hover:bg-surface-2 transition-colors border border-line"
            title={t('export.gatherer')}
          >
            <img
              src={GATHERER_FAVICON_URL}
              alt={t('export.gatherer')}
              className="w-3 h-3 opacity-70"
              onError={(e) => (e.currentTarget.style.display = 'none')}
            />
            <FaExternalLinkAlt className="text-[10px] opacity-60" />
            {t('export.gatherer')}
          </a>
        )}
      </div>

      {!isDeckCard && !isToken && onAddCardToDeck && (
        <button
          type="button"
          onClick={onAddCardToDeck}
          className="primary-button text-sm py-2 px-5 ml-auto shadow-md flex items-center gap-2 font-bold"
        >
          {t('cardDetails.addToDeck')}
        </button>
      )}
    </div>
  );
}
