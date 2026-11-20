import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { FaPalette, FaTimes, FaSearch, FaSpinner, FaPlus } from 'react-icons/fa';
import { Card } from '../../types/Card';
import { getCardImageUrl } from '../../utils/deckGrouping';
import { TokenPreset } from '../playtest/PlaytestTokenModal';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { useSwipeToClose } from '../../hooks/useSwipeToClose';

interface TokenSearchModalProps {
  onClose: () => void;
  presets: TokenPreset[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  searchResults: Card[];
  isSearching: boolean;
  searchError: string | null;
  onSearch: (e?: React.FormEvent) => void;
  onPresetClick: (preset: TokenPreset) => void;
  onSelectToken: (token: Card) => void;
  onConfirmAdd: (token: Card) => void;
}

/** Modal to search Scryfall tokens and quick-add presets to the deck. */
export function TokenSearchModal({
  onClose,
  presets,
  searchTerm,
  setSearchTerm,
  searchResults,
  isSearching,
  searchError,
  onSearch,
  onPresetClick,
  onSelectToken,
  onConfirmAdd
}: TokenSearchModalProps) {
  const { t } = useTranslation();
  const dialogRef = useFocusTrap<HTMLDivElement>(true);
  useEscapeKey(onClose);
  const { onTouchStart, onTouchMove, onTouchEnd, panelStyle } = useSwipeToClose<HTMLDivElement>(onClose);

  return createPortal(
    // Backdrop click is a mouse-only convenience; Escape and the close button provide the keyboard-equivalent action.
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
    <div
      className="modal-overlay modal-overlay-sheet bg-slate-950/85 backdrop-blur-sm animate-fadeIn z-[var(--z-overlay)]"
      style={{ zIndex: 'var(--z-overlay)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="token-search-modal-title"
        className="modal-sheet-panel bg-surface-1 border border-line text-fg rounded-t-2xl sm:rounded-2xl sm:max-w-3xl shadow-2xl flex flex-col overflow-hidden transition-all"
        style={panelStyle}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Grab handle: purely a visual affordance now — drag-to-close works
            from anywhere on the sheet (see useSwipeToClose), not just here. */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-1" aria-hidden="true">
          <div className="w-10 h-1.5 rounded-full bg-surface-3" />
        </div>
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line bg-surface-2">
          <h3
            id="token-search-modal-title"
            className="text-base font-bold text-fg uppercase tracking-wider flex items-center gap-2"
          >
            <FaPalette className="text-indigo-500" />
            {t('tokens.searchTokensTitle')}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-fg-secondary p-1.5 rounded-lg hover:bg-surface-2 transition-all cursor-pointer"
          >
            <FaTimes />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Search Form */}
          <form onSubmit={onSearch} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('tokens.searchTokenPlaceholder')}
                className="w-full text-sm py-2 px-3 pl-9 bg-surface-2 text-fg border border-line-strong rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              />
              <FaSearch className="absolute left-3 top-3 text-xs text-gray-400" />
            </div>
            <button
              type="submit"
              disabled={isSearching || !searchTerm.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white font-extrabold text-xs py-2 px-4 rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {isSearching ? <FaSpinner className="animate-spin text-xs" /> : <FaSearch className="text-xs" />}
              {t('search.searchButton')}
            </button>
          </form>

          {/* Quick Presets Section */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-fg-muted uppercase tracking-widest flex items-center gap-1.5 border-b border-line pb-1 select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              <span>{t('tokens.quickPresets')}</span>
            </h4>
            <div className="flex flex-wrap gap-2">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onPresetClick(preset)}
                  className="bg-surface-2 hover:bg-surface-3 text-fg-secondary border border-line-strong rounded-full px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm hover:scale-102"
                >
                  {preset.imageUrl && (
                    <div className="w-4 h-4 rounded-full overflow-hidden border border-line-strong bg-slate-900 shrink-0">
                      <img src={preset.imageUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <span>{t(`tokens.${preset.localeKey}`)}</span>
                  {preset.power && preset.toughness && (
                    <span className="text-[10px] text-fg-muted font-bold">
                      {preset.power}/{preset.toughness}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Search Results Area */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-fg-muted uppercase tracking-widest flex items-center gap-1.5 border-b border-line pb-1 select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              <span>{t('tokens.searchResults')}</span>
            </h4>

            {isSearching ? (
              <div className="h-48 flex flex-col items-center justify-center gap-2.5 text-gray-400">
                <FaSpinner className="text-2xl text-indigo-500 animate-spin" />
                <span className="text-xs font-semibold">{t('tokens.searching')}</span>
              </div>
            ) : searchError ? (
              <div className="h-48 flex items-center justify-center text-xs font-bold text-red-500">{searchError}</div>
            ) : searchResults.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-fg-muted gap-1">
                <span className="text-xs font-bold">{t('tokens.noTokensFoundSearch')}</span>
                <span className="text-[10px] text-fg-muted">{t('tokens.searchInstructions')}</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {searchResults.map((token) => {
                  const imgUrl = getCardImageUrl(token);

                  return (
                    <div
                      key={token.id}
                      role="button"
                      tabIndex={0}
                      aria-label={token.name}
                      onClick={() => onSelectToken(token)}
                      onKeyDown={(e) => {
                        if (e.target !== e.currentTarget) return;
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onSelectToken(token);
                        }
                      }}
                      className="border border-line bg-surface-2/50 rounded-xl p-3 flex flex-col justify-between items-center text-center cursor-pointer transition-all duration-300 hover:scale-102 hover:shadow-lg hover:border-indigo-500/50 group"
                    >
                      <div className="w-20 h-28 rounded-lg overflow-hidden border border-line bg-slate-950 mb-2 shadow-md flex items-center justify-center relative shrink-0">
                        {imgUrl ? (
                          <img
                            src={imgUrl}
                            alt={token.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center gap-1.5 p-1 text-center w-full h-full bg-slate-900 border border-slate-800 rounded-lg">
                            <FaPalette className="text-indigo-500/40 text-xs shrink-0" />
                            <span className="text-[8px] text-gray-400 font-bold leading-tight break-words line-clamp-3 select-none">
                              {token.name}
                            </span>
                          </div>
                        )}
                        {token.power && token.toughness && (
                          <div className="absolute bottom-1 right-1 bg-slate-900/90 border border-slate-700/50 rounded px-1 text-[8px] font-bold text-slate-350 shadow">
                            {token.power}/{token.toughness}
                          </div>
                        )}
                      </div>

                      <div className="w-full min-w-0">
                        <h5 className="text-xs font-bold text-fg-secondary truncate leading-tight group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">
                          {token.name}
                        </h5>
                        <p className="text-[9px] text-fg-muted truncate mt-0.5">{token.type_line}</p>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onConfirmAdd(token);
                        }}
                        className="mt-3 w-full justify-center bg-indigo-650/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 hover:bg-indigo-600 hover:text-white rounded-lg py-1 text-[10px] font-bold transition-all flex items-center gap-1 shadow-xs cursor-pointer"
                      >
                        <FaPlus className="text-[8px]" />
                        {t('tokens.add')}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-line bg-surface-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="bg-surface-3 hover:bg-surface-3 text-fg-secondary font-extrabold text-xs py-2 px-4 rounded-xl transition-all cursor-pointer"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
