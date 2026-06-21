import { useTranslation } from 'react-i18next';
import { FaExternalLinkAlt } from 'react-icons/fa';
import { Card } from '../../types/Card';

interface CardDetailActionsProps {
  card: Card;
  isDeckCard: boolean;
  isToken: boolean;
  onAddCardToDeck?: () => void;
}

export function CardDetailActions({ card, isDeckCard, isToken, onAddCardToDeck }: CardDetailActionsProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-row items-center justify-between w-full mt-auto pt-4 md:pt-6 border-t border-gray-100 dark:border-gray-800">
      <div className="flex gap-2">
        <a
          href={card.scryfall_uri}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-900/50 transition-colors border border-purple-100 dark:border-purple-800/50"
          title={t('export.scryfall')}
        >
          <img
            src="https://assets.scryfall.com/assets/favicon-7aece1879cd785ebf7f6f1f2e46b0ee6ccbf4cf9ab3b0365851493b8e7345db5.ico"
            alt="Scryfall"
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
            title={t('export.gatherer')}
          >
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
