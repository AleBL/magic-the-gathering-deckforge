import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaBalanceScale, FaTimes } from 'react-icons/fa';
import { Deck } from '../../types/Deck';
import { diffDecks, DeckDiffEntry } from '../../utils/deckDiff';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useEscapeKey } from '../../hooks/useEscapeKey';

interface DeckCompareModalProps {
  decks: Deck[];
  onClose: () => void;
}

function DiffSection({
  title,
  entries,
  render
}: {
  title: string;
  entries: DeckDiffEntry[];
  render: (e: DeckDiffEntry) => string;
}) {
  if (entries.length === 0) return null;
  return (
    <div className="space-y-1">
      <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
        {title}
      </span>
      <ul className="space-y-0.5">
        {entries.map((entry) => (
          <li key={entry.name} className="flex items-center justify-between gap-2 text-xs">
            <span className="truncate text-gray-700 dark:text-gray-300">{entry.name}</span>
            <span className="tabular-nums font-semibold shrink-0 text-gray-500">{render(entry)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Side-by-side diff of two saved decks: cards unique to each and copy-count changes. */
export default function DeckCompareModal({ decks, onClose }: DeckCompareModalProps) {
  const { t } = useTranslation();
  const dialogRef = useFocusTrap<HTMLDivElement>(true);
  useEscapeKey(onClose);

  const [aId, setAId] = useState(decks[0]?.id ?? '');
  const [bId, setBId] = useState(decks[1]?.id ?? '');
  const deckA = decks.find((d) => d.id === aId) ?? null;
  const deckB = decks.find((d) => d.id === bId) ?? null;
  const diff = useMemo(() => (deckA && deckB ? diffDecks(deckA.cards, deckB.cards) : null), [deckA, deckB]);
  const identical = diff && diff.onlyInA.length === 0 && diff.onlyInB.length === 0 && diff.changed.length === 0;

  const selectClass =
    'w-full min-h-11 sm:min-h-0 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary';

  return (
    // Backdrop click is a mouse-only convenience; Escape and the close button cover keyboard users.
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
    <div
      className="modal-overlay z-[var(--z-overlay)]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="deck-compare-title"
        className="modal-container sm:max-w-2xl w-full overflow-y-auto animate-fadeIn"
      >
        <div className="flex items-center justify-between mb-4">
          <h3
            id="deck-compare-title"
            className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2"
          >
            <FaBalanceScale className="text-primary" />
            {t('deck.compareDecks')}
          </h3>
          <button type="button" onClick={onClose} className="modal-close-btn" aria-label={t('common.close')}>
            <FaTimes />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <label className="space-y-1 block">
            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
              {t('deck.compareDeckA')}
            </span>
            <select className={selectClass} value={aId} onChange={(e) => setAId(e.target.value)}>
              {decks.map((deck) => (
                <option key={deck.id} value={deck.id}>
                  {deck.name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 block">
            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
              {t('deck.compareDeckB')}
            </span>
            <select className={selectClass} value={bId} onChange={(e) => setBId(e.target.value)}>
              {decks.map((deck) => (
                <option key={deck.id} value={deck.id}>
                  {deck.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {!deckA || !deckB || aId === bId ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-6">{t('deck.comparePickTwo')}</p>
        ) : identical ? (
          <p className="text-sm text-green-600 dark:text-green-400 text-center py-6">{t('deck.compareIdentical')}</p>
        ) : (
          <div className="grid sm:grid-cols-3 gap-4">
            <DiffSection
              title={t('deck.compareOnlyIn', { name: deckA.name })}
              entries={diff!.onlyInA}
              render={(e) => `${e.countA}×`}
            />
            <DiffSection
              title={t('deck.compareOnlyIn', { name: deckB.name })}
              entries={diff!.onlyInB}
              render={(e) => `${e.countB}×`}
            />
            <DiffSection
              title={t('deck.compareChanged')}
              entries={diff!.changed}
              render={(e) => `${e.countA}× → ${e.countB}×`}
            />
          </div>
        )}
      </div>
    </div>
  );
}
