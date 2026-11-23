import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Deck } from '../../types/Deck';
import { normalizeTags } from '../../utils/deckTags';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useEscapeKey } from '../../hooks/useEscapeKey';

interface DeckTagsDialogProps {
  deck: Deck | null;
  /** Tags already used elsewhere in the library, offered with one click. */
  suggestions: string[];
  onSave: (deck: Deck, tags: string[]) => void;
  onClose: () => void;
}

/** Edits a deck's tags as one comma-separated line, with the library's tags to pick from. */
function DeckTagsDialog({ deck, suggestions, onSave, onClose }: DeckTagsDialogProps) {
  const { t } = useTranslation();
  const isOpen = deck !== null;
  const dialogRef = useFocusTrap<HTMLDivElement>(isOpen);
  useEscapeKey(onClose, isOpen);
  const [value, setValue] = useState('');

  useEffect(() => {
    setValue((deck?.tags ?? []).join(', '));
  }, [deck]);

  if (!deck) return null;

  const current = normalizeTags(value);
  const offered = suggestions.filter((tag) => !current.some((own) => own.toLowerCase() === tag.toLowerCase()));

  return (
    <div className="modal-overlay animate-fadeIn" role="presentation">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="deck-tags-title"
        className="modal-container w-full max-w-md"
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSave(deck, current);
          }}
          className="flex flex-col gap-3"
        >
          <h3 id="deck-tags-title" className="font-serif text-xl font-semibold text-fg">
            {t('deckTags.title', { name: deck.name })}
          </h3>
          <label htmlFor="deck-tags-input" className="text-sm text-fg-secondary">
            {t('deckTags.label')}
          </label>
          <input
            id="deck-tags-input"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder={t('deckTags.placeholder')}
            className="h-10 rounded-lg border border-line-strong bg-surface-1 px-3 text-sm text-fg placeholder:text-fg-muted"
          />
          {offered.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {offered.slice(0, 12).map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setValue(normalizeTags([...current, tag]).join(', '))}
                  className="rounded-full border border-line px-2.5 py-0.5 text-xs text-fg-secondary hover:bg-surface-2 hover:text-fg"
                >
                  + {tag}
                </button>
              ))}
            </div>
          ) : null}
          <div className="mt-2 flex justify-end gap-2">
            <button type="button" className="ghost-button" onClick={onClose}>
              {t('common.cancel')}
            </button>
            <button type="submit" className="primary-button">
              {t('deckTags.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default DeckTagsDialog;
