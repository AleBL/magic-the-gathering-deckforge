import { RefObject, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LuClock, LuSearch } from 'react-icons/lu';
import { useNameSuggestions } from '../../hooks/search/useNameSuggestions';
import { clearRecentSearches, readRecentSearches, rememberSearch } from '../../utils/recentSearches';

interface SearchSuggestInputProps {
  value: string;
  onChange: (value: string) => void;
  /** Runs the search for the given text right away. */
  onSubmit: (value: string) => void;
  inputRef: RefObject<HTMLInputElement | null>;
}

/**
 * The search field as a combobox: card names from Scryfall's autocomplete while typing, and
 * the recent searches when the field is empty. Arrow keys move, Enter picks, Escape closes.
 */
export function SearchSuggestInput({ value, onChange, onSubmit, inputRef }: SearchSuggestInputProps) {
  const { t } = useTranslation();
  const listId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [recent, setRecent] = useState<string[]>(() => readRecentSearches());
  const suggestions = useNameSuggestions(value, isOpen);
  const showingRecent = value.trim() === '' && recent.length > 0;
  const options = showingRecent ? recent : suggestions;
  const expanded = isOpen && options.length > 0;

  const submit = (text: string) => {
    setRecent(rememberSearch(text));
    setIsOpen(false);
    setActiveIndex(-1);
    onSubmit(text);
  };

  // Picking only fills the field: the search's own debounce runs it, so the pick does not
  // fire a second request on top of that one.
  const pick = (text: string) => {
    onChange(text);
    setRecent(rememberSearch(text));
    setIsOpen(false);
    setActiveIndex(-1);
  };

  return (
    <div className="relative flex-1 group">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-fg-muted group-focus-within:text-fg-secondary transition-colors">
        <LuSearch className="text-lg" />
      </div>
      <input
        ref={inputRef}
        id="search-input"
        type="text"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={expanded}
        aria-controls={listId}
        aria-activedescendant={expanded && activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
        autoComplete="off"
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setIsOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' && options.length > 0) {
            event.preventDefault();
            setIsOpen(true);
            setActiveIndex((index) => (index + 1) % options.length);
          } else if (event.key === 'ArrowUp' && options.length > 0) {
            event.preventDefault();
            setActiveIndex((index) => (index <= 0 ? options.length - 1 : index - 1));
          } else if (event.key === 'Escape' && expanded) {
            event.stopPropagation();
            setIsOpen(false);
          } else if (event.key === 'Enter') {
            event.preventDefault();
            if (expanded && activeIndex >= 0) pick(options[activeIndex]);
            else submit(value);
          }
        }}
        placeholder={t('search.searchPlaceholder')}
        className="w-full pl-11 pr-4 py-3.5 bg-surface-1 border border-line-strong rounded-xl text-base text-fg placeholder:text-fg-muted focus:outline-none focus:border-fg-muted focus-visible:outline-2 focus-visible:outline-focus transition-colors duration-150"
      />
      {expanded ? (
        <div className="absolute left-0 right-0 top-full z-[var(--z-dropdown)] mt-1 overflow-hidden rounded-lg border border-line bg-surface-1 shadow-lg">
          {showingRecent ? (
            <div className="flex items-center justify-between px-3 pt-2 pb-1 text-xs text-fg-muted">
              <span>{t('search.recentSearches')}</span>
              <button
                type="button"
                // Keeps focus in the field so the list does not close before the click lands.
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  clearRecentSearches();
                  setRecent([]);
                }}
                className="hover:text-fg"
              >
                {t('search.clearRecent')}
              </button>
            </div>
          ) : null}
          <ul id={listId} role="listbox" aria-label={t('search.suggestions')} className="py-1">
            {options.map((option, index) => (
              // Keyboard choice lives on the combobox input (arrows + Enter through
              // aria-activedescendant), as the ARIA pattern prescribes; options are not focusable.
              // eslint-disable-next-line jsx-a11y/click-events-have-key-events
              <li
                key={option}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => pick(option)}
                className={`flex cursor-pointer items-center gap-2 px-3 py-2 text-sm ${
                  index === activeIndex ? 'bg-surface-2 text-fg' : 'text-fg-secondary hover:bg-surface-2'
                }`}
              >
                {showingRecent ? <LuClock className="shrink-0 text-fg-muted" aria-hidden="true" /> : null}
                <span className="truncate">{option}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
