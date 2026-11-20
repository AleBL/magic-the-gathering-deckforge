import { useTranslation } from 'react-i18next';
import { LuMinus, LuPalette, LuPlus, LuRefreshCw } from 'react-icons/lu';
import { Card } from '../../types/Card';

interface CardDetailEditControlsProps {
  isDeckCard: boolean;
  isEditMode: boolean;
  isToken: boolean;
  hidePrintsSidebar: boolean;
  copiesCount: number;
  hasArtChanged: boolean;
  prints: Card[];
  /** Set when the lookup failed, which is not the same as a card having one printing. */
  printsError?: string | null;
  showPrintsSidebar: boolean;
  setShowPrintsSidebar: React.Dispatch<React.SetStateAction<boolean>>;
  handleDecrementCopies: () => void;
  handleIncrementCopies: () => void;
  handleConfirmArtChange: () => void;
}

export function CardDetailEditControls({
  isDeckCard,
  isEditMode,
  isToken,
  hidePrintsSidebar,
  copiesCount,
  hasArtChanged,
  prints,
  printsError,
  showPrintsSidebar,
  setShowPrintsSidebar,
  handleDecrementCopies,
  handleIncrementCopies,
  handleConfirmArtChange
}: CardDetailEditControlsProps) {
  const { t } = useTranslation();

  if (!isDeckCard || !isEditMode) return null;

  return (
    <div className="border-t border-line pt-4 mt-auto space-y-4">
      <h3 className="font-semibold text-[11px] text-fg-muted flex items-center gap-2 select-none">
        <LuPalette className="text-accent" />
        <span>{t('cardDetails.copiesAndArt')}</span>
      </h3>

      <div className="bg-surface-1 border border-line rounded-xl p-3 flex flex-row items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-xs font-medium text-fg-muted">{t('cardDetails.inDeck')}</span>
            <span className="text-base font-semibold text-fg">
              {copiesCount} {copiesCount === 1 ? t('cardDetails.copyCountSingular') : t('cardDetails.copyCountPlural')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {copiesCount === 1 ? (
            <button
              type="button"
              onClick={handleDecrementCopies}
              className="px-3 py-1.5 flex items-center gap-1.5 text-xs font-medium text-danger dark:text-danger bg-danger-soft hover:bg-danger-soft rounded-lg transition-colors border border-danger/40"
            >
              {t('cardDetails.remove')}
            </button>
          ) : (
            <div className="flex items-center bg-surface-2 border border-line rounded-lg overflow-hidden shrink-0">
              <button
                type="button"
                onClick={handleDecrementCopies}
                className="w-9 h-8 flex items-center justify-center text-fg-muted hover:text-fg-secondary hover:bg-surface-3 transition-colors"
                title={t('cardDetails.removeCopy')}
              >
                <LuMinus className="text-[10px]" />
              </button>
              <div className="w-8 h-8 flex items-center justify-center font-semibold text-sm text-fg border-x border-line">
                {copiesCount}
              </div>
              <button
                type="button"
                onClick={handleIncrementCopies}
                className="w-9 h-8 flex items-center justify-center text-fg-muted hover:text-fg-secondary hover:bg-surface-3 transition-colors"
                title={t('cardDetails.addCopy')}
              >
                <LuPlus className="text-[10px]" />
              </button>
            </div>
          )}

          {copiesCount === 1 && (
            <button
              type="button"
              onClick={handleIncrementCopies}
              className="w-9 h-8 flex items-center justify-center text-fg-muted hover:text-fg-secondary bg-surface-2 border border-line rounded-lg hover:bg-surface-3 transition-colors ml-1"
              title={t('cardDetails.addCopy')}
            >
              <LuPlus className="text-[10px]" />
            </button>
          )}
        </div>
      </div>

      {!isToken && !hidePrintsSidebar && (
        <div className="flex flex-wrap gap-2.5">
          {/* Said here rather than in a toast: with the lookup failed there is no editions
              button, and an absent control looks like a card with a single printing. */}
          {printsError ? (
            <p className="w-full text-xs font-semibold text-warning">{t('common.printsLoadError')}</p>
          ) : null}
          {prints.length > 1 && (
            <button
              type="button"
              onClick={() => setShowPrintsSidebar((prev) => !prev)}
              className={`secondary-button text-xs py-2 px-3.5 flex-1 flex items-center justify-center gap-1.5 shadow-sm border border-line transition-all ${
                showPrintsSidebar ? 'bg-accent-soft text-accent border-line-strong' : ''
              }`}
            >
              <LuPalette className="text-xs shrink-0" />
              {t('cardDetails.showEditions')}
            </button>
          )}

          {hasArtChanged && (
            <button
              type="button"
              onClick={handleConfirmArtChange}
              className="success-button text-xs py-2 px-3.5 flex-1 flex items-center justify-center gap-1.5 shadow-md transition-all"
            >
              <LuRefreshCw className="text-xs shrink-0 animate-spin-slow" />
              {t('cardDetails.updateArt')}
            </button>
          )}
        </div>
      )}

      {isToken && prints.length > 1 && !hidePrintsSidebar && (
        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={() => setShowPrintsSidebar((prev) => !prev)}
            className={`secondary-button text-xs py-2 px-3.5 flex-1 flex items-center justify-center gap-1.5 shadow-sm border border-line transition-all ${
              showPrintsSidebar ? 'bg-accent-soft text-accent border-line-strong' : ''
            }`}
          >
            <LuPalette className="text-xs shrink-0" />
            {t('cardDetails.changeArt')}
          </button>

          {hasArtChanged && (
            <button
              type="button"
              onClick={handleConfirmArtChange}
              className="success-button text-xs py-2 px-3.5 flex-1 flex items-center justify-center gap-1.5 shadow-md transition-all"
            >
              <LuRefreshCw className="text-xs shrink-0 animate-spin-slow" />
              {t('cardDetails.updateArt')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
