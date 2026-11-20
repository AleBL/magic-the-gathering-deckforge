import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LuChevronDown, LuChevronUp, LuScale } from 'react-icons/lu';
import { useCardRulings } from '../../hooks/useCardRulings';
import { parseTextWithSymbols } from '../../utils/symbolHelper';

interface CardDetailRulingsProps {
  cardId: string | undefined;
  oracleId: string | undefined;
}

/**
 * The official rulings for the card, closed by default and fetched on first open. Scryfall
 * publishes them in English only, which the panel says when the interface is not English.
 */
export function CardDetailRulings({ cardId, oracleId }: CardDetailRulingsProps) {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const { state, retry } = useCardRulings(cardId, oracleId, isOpen);

  if (!cardId) return null;
  const rulings = state.status === 'loaded' ? state.rulings : null;

  const formatDate = (iso: string) => {
    const date = new Date(`${iso}T00:00:00`);
    return Number.isNaN(date.getTime())
      ? iso
      : date.toLocaleDateString(i18n.language, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <section className="border-t border-line pt-3 mt-3">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-controls="card-rulings"
        className="flex w-full items-center justify-between gap-2 rounded-md py-1 text-sm font-medium text-fg-secondary hover:text-fg transition-colors"
      >
        <span className="flex items-center gap-2">
          <LuScale className="text-fg-muted" aria-hidden="true" />
          {t('cardDetails.rulings')}
          {rulings ? <span className="text-fg-muted">({rulings.length})</span> : null}
        </span>
        {isOpen ? <LuChevronUp aria-hidden="true" /> : <LuChevronDown aria-hidden="true" />}
      </button>

      {isOpen ? (
        <div id="card-rulings" className="mt-2 text-sm" aria-live="polite">
          {state.status === 'error' ? (
            <p className="flex flex-wrap items-center gap-2 text-fg-secondary">
              {t('cardDetails.rulingsError')}
              <button type="button" onClick={retry} className="text-accent underline underline-offset-2">
                {t('common.tryAgain')}
              </button>
            </p>
          ) : !rulings ? (
            <p className="text-fg-muted">{t('cardDetails.rulingsLoading')}</p>
          ) : rulings.length === 0 ? (
            <p className="text-fg-muted">{t('cardDetails.rulingsNone')}</p>
          ) : (
            <>
              {!i18n.language.startsWith('en') ? (
                <p className="mb-2 text-xs text-fg-muted">{t('cardDetails.rulingsEnglishOnly')}</p>
              ) : null}
              <ol className="space-y-3">
                {rulings.map((ruling, index) => (
                  <li key={`${ruling.publishedAt}-${index}`}>
                    <time dateTime={ruling.publishedAt} className="block text-xs text-fg-muted">
                      {formatDate(ruling.publishedAt)}
                    </time>
                    <p className="text-fg">{parseTextWithSymbols(ruling.comment)}</p>
                  </li>
                ))}
              </ol>
            </>
          )}
        </div>
      ) : null}
    </section>
  );
}
