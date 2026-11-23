import { useTranslation } from 'react-i18next';
import { LuArrowRight, LuDices, LuLayers, LuPlus, LuRefreshCw, LuUndo2 } from 'react-icons/lu';
import { usePlaytestContext } from './PlaytestContext';
import { useRipple } from '../../hooks/useRipple';
import { Card } from '../../types/Card';

export function PlaytestControlBarBottom({ deckCards }: { deckCards: Card[] }) {
  const { t } = useTranslation();
  const createRipple = useRipple();
  const {
    handleNextTurn,
    handleDrawCard,
    handleShuffleLibrary,
    handleUntapAll,
    setIsTokenModalOpen,
    handleMulligan,
    startSimulation,
    isMulliganPhase,
    library,
    battlefield
  } = usePlaytestContext();

  return (
    <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={(event) => {
            createRipple(event);
            handleNextTurn();
          }}
          disabled={isMulliganPhase}
          className="ripple-container bg-surface-1 hover:bg-surface-2 border border-line-strong text-fg font-medium text-xs py-2 px-5 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
          title={`${t('playtest.nextTurn')} (T)`}
        >
          <LuArrowRight className="text-[10px]" />
          {t('playtest.nextTurn')}
        </button>

        <button
          type="button"
          onClick={(event) => {
            createRipple(event);
            handleDrawCard();
          }}
          disabled={library.length === 0 || isMulliganPhase}
          className="ripple-container bg-surface-1 hover:bg-surface-2 border border-line-strong text-fg font-medium text-xs py-2 px-5 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
          title={`${t('playtest.drawCard')} (D)`}
        >
          <LuLayers className="text-[10px]" />
          {t('playtest.drawCard')}
        </button>

        <button
          type="button"
          onClick={(event) => {
            createRipple(event);
            handleShuffleLibrary();
          }}
          disabled={library.length === 0 || isMulliganPhase}
          className="ripple-container bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs py-2 px-5 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
          title={`${t('playtest.shuffle')} (S)`}
        >
          <LuDices className="text-[10px]" />
          {t('playtest.shuffle')}
        </button>

        <button
          type="button"
          onClick={(event) => {
            createRipple(event);
            handleUntapAll();
          }}
          disabled={battlefield.length === 0 || isMulliganPhase}
          className="ripple-container bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs py-2 px-5 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
        >
          <LuRefreshCw className="text-[10px]" />
          {t('playtest.untapAll')}
        </button>

        <button
          type="button"
          onClick={(event) => {
            createRipple(event);
            setIsTokenModalOpen(true);
          }}
          disabled={isMulliganPhase}
          className="ripple-container bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs py-2 px-5 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
        >
          <LuPlus className="text-[10px]" />
          {t('tokens.summonToken')}
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={(event) => {
            createRipple(event);
            handleMulligan();
          }}
          disabled={deckCards.length === 0 || isMulliganPhase}
          className="ripple-container bg-surface-1 hover:bg-surface-2 border border-line-strong text-fg font-medium text-xs py-2 px-5 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
        >
          <LuUndo2 className="text-[10px] rotate-90" />
          {t('playtest.mulligan')}
        </button>
        <button
          type="button"
          onClick={(event) => {
            createRipple(event);
            startSimulation();
          }}
          className="ripple-container bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs py-2 px-5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <LuUndo2 className="text-[10px]" />
          {t('playtest.resetSimulator')}
        </button>
      </div>
    </div>
  );
}
