import { useTranslation } from 'react-i18next';
import {
  LuCheck,
  LuFileText,
  LuInbox,
  LuKeyboard,
  LuMinus,
  LuPlus,
  LuRedo2,
  LuSkull,
  LuUndo2,
  LuX
} from 'react-icons/lu';
import { usePlaytestContext } from './PlaytestContext';

export function PlaytestControlBarTop({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const {
    handleUntapAll,
    handleNextTurn,
    handleUndo,
    handleRedo,
    canUndo,
    canRedo,
    lifeTotal,
    setLifeTotal,
    isMulliganPhase,
    turn,
    mulligans,
    setPileExplorerConfig,
    setIsShortcutsOpen,
    library,
    hand,
    graveyard,
    isLogOpen,
    setIsLogOpen,
    setScrySurveilPrompt
  } = usePlaytestContext();

  return (
    <div className="relative bg-surface-1 border-b border-line p-2 sm:p-4 shrink-0 shadow-sm z-50">
      <div className="flex justify-between items-center max-w-7xl mx-auto w-full pr-8">
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          <button
            type="button"
            onClick={handleUntapAll}
            className="bg-surface-3 hover:bg-surface-3 text-fg text-[11px] sm:text-xs font-semibold px-2 sm:px-4 py-1.5 sm:py-2 min-h-[44px] sm:min-h-0 rounded-lg transition-all shadow-sm hover:shadow active:scale-95"
          >
            {t('playtest.untapAll')}
          </button>
          <button
            type="button"
            onClick={handleNextTurn}
            className="bg-primary hover:bg-primary-hover text-on-primary text-[11px] sm:text-xs font-semibold px-2 sm:px-4 py-1.5 sm:py-2 min-h-[44px] sm:min-h-0 rounded-lg transition-all shadow-sm hover:shadow active:scale-95"
          >
            {t('playtest.nextTurn')}
          </button>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleUndo}
              disabled={!canUndo}
              title={`${t('playtest.undo')} (Ctrl+Z)`}
              className="w-11 h-11 sm:w-7 sm:h-7 rounded-lg bg-surface-2 border border-line text-fg-secondary flex items-center justify-center hover:bg-surface-3 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-xs"
            >
              <LuUndo2 />
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={!canRedo}
              title={`${t('playtest.redo')} (Ctrl+Y)`}
              className="w-11 h-11 sm:w-7 sm:h-7 rounded-lg bg-surface-2 border border-line text-fg-secondary flex items-center justify-center hover:bg-surface-3 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-xs"
            >
              <LuRedo2 />
            </button>
          </div>

          <div className="flex items-center bg-surface-2 border border-line rounded-xl px-2 sm:px-3 py-1 shadow-inner gap-1.5 sm:gap-2">
            <span className="text-[11px] sm:text-[11px] text-fg-muted font-semibold">{t('playtest.life')}:</span>
            <button
              type="button"
              onClick={() => setLifeTotal((prev: number) => prev - 1)}
              className="w-11 h-11 sm:w-5 sm:h-5 rounded bg-danger-soft text-danger border border-danger/40 flex items-center justify-center hover:bg-danger hover:text-on-danger transition-all text-xs font-semibold cursor-pointer"
            >
              <LuMinus className="text-[11px] sm:text-[8px]" />
            </button>
            <span className="text-sm font-semibold text-fg w-6 text-center select-none font-mono drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]">
              {lifeTotal}
            </span>
            <button
              type="button"
              onClick={() => setLifeTotal((prev: number) => prev + 1)}
              className="w-11 h-11 sm:w-5 sm:h-5 rounded bg-success-soft text-success border border-success/40 flex items-center justify-center hover:bg-success hover:text-on-success transition-all text-xs font-semibold cursor-pointer"
            >
              <LuPlus className="text-[11px] sm:text-[8px]" />
            </button>
          </div>

          {!isMulliganPhase && (
            <div className="flex items-center bg-surface-2 border border-line rounded-xl px-2 sm:px-3 py-1 shadow-inner gap-2 hidden sm:flex">
              <span className="text-[11px] sm:text-[11px] text-accent font-semibold">
                {t('playtest.turnLabel', { turn })}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-4">
          <div className="hidden lg:flex items-center gap-4 text-xs font-semibold text-fg-muted">
            <button
              type="button"
              onClick={() => setPileExplorerConfig({ title: t('playtest.library'), pile: 'library' })}
              className="flex items-center gap-1.5 hover:text-accent transition-colors cursor-pointer"
              title={t('playtest.viewLibrary')}
            >
              <LuInbox className="text-fg-muted" />
              {t('playtest.library')}: <strong className="text-fg-secondary">{library.length}</strong>
            </button>
            <span className="flex items-center gap-1.5">
              <LuCheck className="text-fg-muted" />
              {t('playtest.hand')}: <strong className="text-fg-secondary">{hand.length}</strong>
            </span>
            <button
              type="button"
              onClick={() => setPileExplorerConfig({ title: t('playtest.graveyard'), pile: 'graveyard' })}
              className="flex items-center gap-1.5 hover:text-accent transition-colors cursor-pointer"
              title={t('playtest.viewGraveyard')}
            >
              <LuSkull className="text-fg-muted" />
              {t('playtest.graveyard')}: <strong className="text-fg-secondary">{graveyard.length}</strong>
            </button>
            {mulligans > 0 && (
              <span className="bg-warning-soft text-warning border border-warning/40 px-2 py-0.5 rounded-full">
                Mulligan: <strong>{mulligans}</strong>
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsLogOpen((prev: boolean) => !prev)}
            title={t('playtest.toggleLogPanel')}
            className={`p-1.5 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 rounded-lg border transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer ${
              isLogOpen
                ? 'bg-accent-soft border-line-strong text-accent '
                : 'bg-surface-2 border-line text-fg-muted hover:text-fg-secondary '
            }`}
          >
            <LuFileText className="text-xs shrink-0" />
            <span className="hidden md:inline font-semibold">{t('playtest.playtestLog')}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsShortcutsOpen((prev: boolean) => !prev)}
            title={`${t('playtest.shortcuts')} (?)`}
            className="p-1.5 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 rounded-lg border bg-surface-2 border-line text-fg-muted hover:text-fg-secondary transition-all text-xs flex items-center justify-center cursor-pointer"
          >
            <LuKeyboard className="text-xs shrink-0" />
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setScrySurveilPrompt({ type: 'scry' })}
              className="bg-surface-3 hover:bg-surface-3 text-fg text-xs px-2 py-1.5 min-h-[44px] sm:min-h-0 rounded transition-colors cursor-pointer"
            >
              {t('playtest.scry')}
            </button>
            <button
              type="button"
              onClick={() => setScrySurveilPrompt({ type: 'surveil' })}
              className="bg-surface-3 hover:bg-surface-3 text-fg text-xs px-2 py-1.5 min-h-[44px] sm:min-h-0 rounded transition-colors cursor-pointer"
            >
              {t('playtest.surveil')}
            </button>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label={t('common.close')}
        title={t('common.close')}
        className="absolute top-3 right-3 text-fg-muted hover:text-fg-secondary p-1.5 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center rounded-lg hover:bg-surface-2 transition-all cursor-pointer z-50 bg-surface-1/80 backdrop-blur shadow"
      >
        <LuX />
      </button>
    </div>
  );
}
