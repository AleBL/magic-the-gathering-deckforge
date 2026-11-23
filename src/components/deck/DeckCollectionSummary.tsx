import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { LuChevronDown, LuCircleCheck, LuPackageOpen, LuX } from 'react-icons/lu';
import { db } from '../../db/database';
import { Card } from '../../types/Card';
import { CollectionEntry } from '../../types/Collection';
import { computeDeckCollectionGap, formatCurrency } from '../../utils/collectionMath';
import { useCollectionSettings } from '../../store/useCollectionSettings';

interface DeckCollectionSummaryProps {
  cards: Card[];
}

/**
 * Stable fallback for the first render, before useLiveQuery resolves. A fresh `[]`
 * here would be a new reference every render and would invalidate the memo below.
 */
const NO_ENTRIES: CollectionEntry[] = [];

/** Compares the deck against the owned collection: how many cards are still to buy and the estimated cost. */
export function DeckCollectionSummary({ cards }: DeckCollectionSummaryProps) {
  const { t } = useTranslation();
  const currency = useCollectionSettings((state) => state.currency);
  const showDeckGap = useCollectionSettings((state) => state.showDeckGap);
  const setShowDeckGap = useCollectionSettings((state) => state.setShowDeckGap);
  const entries = useLiveQuery(() => db.collection.toArray(), []) ?? NO_ENTRIES;
  const [expanded, setExpanded] = useState(false);

  const gap = useMemo(() => computeDeckCollectionGap(cards, entries, currency), [cards, entries, currency]);

  // Dismissed for good, until switched back on in the deck's display options. Hooks above
  // still run, so the rule of hooks holds and the preference can flip without a remount.
  if (!showDeckGap) return null;
  if (gap.totalNeeded === 0) return null;

  const complete = gap.missingCopies === 0;
  const missingRows = gap.rows.filter((row) => row.missing > 0);

  return (
    <div
      className={`rounded-xl border p-3 ${
        complete ? 'bg-success-soft border-success/40 ' : 'bg-warning-soft border-warning/40 '
      }`}
    >
      <div className="flex items-center gap-2 flex-wrap">
        {complete ? (
          <LuCircleCheck className="text-success shrink-0" />
        ) : (
          <LuPackageOpen className="text-warning shrink-0" />
        )}
        <span className="text-sm font-semibold text-fg">
          {complete
            ? t('collection.deckComplete')
            : t('collection.deckMissing', {
                count: gap.missingCopies,
                value: formatCurrency(gap.missingValue, currency)
              })}
        </span>
        <span className="text-xs text-fg-muted">
          {t('collection.deckOwnedOf', { owned: gap.totalOwned, total: gap.totalNeeded })}
        </span>
        {!complete && missingRows.length > 0 ? (
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            aria-expanded={expanded}
            className="ml-auto flex items-center gap-1 text-xs font-semibold text-warning hover:underline"
          >
            {t('collection.deckShoppingList')}
            <LuChevronDown className={`text-[10px] transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => setShowDeckGap(false)}
          title={t('collection.deckGapHide')}
          aria-label={t('collection.deckGapHide')}
          className={`${complete || missingRows.length === 0 ? 'ml-auto' : 'ml-1'} shrink-0 p-1 rounded text-gray-400 hover:text-fg-secondary hover:bg-black/5 dark:hover:bg-white/10 transition-colors`}
        >
          <LuX className="text-[11px]" />
        </button>
      </div>

      {expanded && !complete ? (
        <ul className="mt-2 pt-2 border-t border-warning/40 flex flex-col gap-1">
          {missingRows.map((row) => (
            <li key={row.name} className="flex items-center justify-between text-xs text-fg-secondary">
              <span className="truncate">
                <span className="font-semibold tabular-nums">{row.missing}×</span> {row.name}
              </span>
              <span className="tabular-nums text-fg-muted shrink-0 ml-2">
                {row.unitPrice !== null ? formatCurrency(row.missingValue, currency) : '—'}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
