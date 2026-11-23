import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LuGitCompareArrows, LuX } from 'react-icons/lu';
import { Deck } from '../../types/Deck';
import { compareDecks, CompareEntry } from '../../utils/deckCompare';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useEscapeKey } from '../../hooks/useEscapeKey';

interface DeckCompareModalProps {
  /** The deck the comparison was opened from; null keeps the modal closed. */
  baseDeck: Deck | null;
  decks: Deck[];
  onClose: () => void;
}

function EntryList({ title, entries }: { title: string; entries: CompareEntry[] }) {
  const { t } = useTranslation();
  return (
    <section className="min-w-0">
      <h4 className="mb-2 text-sm font-medium text-fg-secondary">
        {title} <span className="text-fg-muted">({entries.length})</span>
      </h4>
      {entries.length === 0 ? (
        <p className="text-sm text-fg-muted">{t('deckCompare.none')}</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {entries.map((entry) => (
            <li key={entry.name} className="flex gap-2">
              <span className="w-6 shrink-0 text-right text-fg-muted">{entry.count}</span>
              <span className="truncate text-fg">{entry.name}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** Two decks side by side by card name: what each runs alone and where the counts differ. */
function DeckCompareModal({ baseDeck, decks, onClose }: DeckCompareModalProps) {
  const { t } = useTranslation();
  const isOpen = baseDeck !== null;
  const dialogRef = useFocusTrap<HTMLDivElement>(isOpen);
  useEscapeKey(onClose, isOpen);
  const others = useMemo(() => decks.filter((deck) => deck.id !== baseDeck?.id), [decks, baseDeck]);
  const [otherId, setOtherId] = useState<string | null>(null);
  const other = others.find((deck) => deck.id === otherId) ?? others[0] ?? null;
  const comparison = useMemo(
    () => (baseDeck && other ? compareDecks(baseDeck.cards, other.cards) : null),
    [baseDeck, other]
  );

  if (!baseDeck) return null;

  return (
    <div className="modal-overlay animate-fadeIn" role="presentation">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="deck-compare-title"
        className="modal-container w-full max-w-3xl max-h-[85vh] overflow-y-auto"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h3 id="deck-compare-title" className="flex items-center gap-2 font-serif text-xl font-semibold text-fg">
            <LuGitCompareArrows className="text-fg-muted" aria-hidden="true" />
            {t('deckCompare.title')}
          </h3>
          <button type="button" onClick={onClose} className="ghost-button px-2" aria-label={t('common.close')}>
            <LuX aria-hidden="true" />
          </button>
        </div>

        {others.length === 0 || !other || !comparison ? (
          <p className="text-sm text-fg-muted">{t('deckCompare.needTwo')}</p>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
              <span className="font-medium text-fg">{baseDeck.name}</span>
              <span className="text-fg-muted">{t('deckCompare.versus')}</span>
              <label className="min-w-0">
                <span className="sr-only">{t('deckCompare.compareWith')}</span>
                <select
                  value={other.id}
                  onChange={(event) => setOtherId(event.target.value)}
                  className="h-9 max-w-full rounded-lg border border-line-strong bg-surface-1 px-2 text-sm text-fg"
                >
                  {others.map((deck) => (
                    <option key={deck.id} value={deck.id}>
                      {deck.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <p className="mb-4 text-sm text-fg-secondary">{t('deckCompare.shared', { count: comparison.shared })}</p>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <EntryList title={t('deckCompare.onlyIn', { name: baseDeck.name })} entries={comparison.onlyLeft} />
              <EntryList title={t('deckCompare.onlyIn', { name: other.name })} entries={comparison.onlyRight} />
              <section className="min-w-0">
                <h4 className="mb-2 text-sm font-medium text-fg-secondary">
                  {t('deckCompare.differentCounts')}{' '}
                  <span className="text-fg-muted">({comparison.different.length})</span>
                </h4>
                {comparison.different.length === 0 ? (
                  <p className="text-sm text-fg-muted">{t('deckCompare.none')}</p>
                ) : (
                  <ul className="space-y-1 text-sm">
                    {comparison.different.map((entry) => (
                      <li key={entry.name} className="flex gap-2">
                        <span className="w-12 shrink-0 text-right text-fg-muted">
                          {entry.left} → {entry.right}
                        </span>
                        <span className="truncate text-fg">{entry.name}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default DeckCompareModal;
