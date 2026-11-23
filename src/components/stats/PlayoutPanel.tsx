import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LuDices, LuRedo2 } from 'react-icons/lu';
import { Card } from '../../types/Card';
import { simulatePlayout } from '../../utils/playoutSimulation';
import EmptyState from '../ui/EmptyState';

interface PlayoutPanelProps {
  currentDeck: Card[];
}

const RUNS = 1000;
const TURNS = 8;

/** Percentage bar sized by `share`, for the kept-hand and milestone rows. */
function ShareBar({ share, tone = 'primary' }: { share: number; tone?: 'primary' | 'warning' }) {
  return (
    <div className="h-1.5 rounded-full bg-surface-3 overflow-hidden">
      <div
        className={`h-full rounded-full ${tone === 'warning' ? 'bg-warning' : 'bg-primary'}`}
        style={{ width: `${Math.round(share * 100)}%` }}
      />
    </div>
  );
}

/**
 * Monte Carlo mana report. It sits beside the hypergeometric panels rather than replacing
 * them: those give exact odds for a fixed opening hand, this one covers what only a played-out
 * game shows — mulligan decisions and casting on curve.
 */
export function PlayoutPanel({ currentDeck }: PlayoutPanelProps) {
  const { t } = useTranslation();
  // A seed makes each run reproducible; bumping it is what "simulate again" does.
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 2 ** 31));

  const result = useMemo(() => simulatePlayout(currentDeck, { runs: RUNS, turns: TURNS, seed }), [currentDeck, seed]);

  const reroll = useCallback(() => setSeed(Math.floor(Math.random() * 2 ** 31)), []);
  const percent = (value: number) => `${Math.round(value * 100)}%`;

  if (!result) {
    return (
      <div className="space-y-4 min-w-0">
        <h4 className="font-semibold text-sm text-fg-secondary flex items-center gap-2">
          <LuDices className="text-accent" />
          {t('stats.playout')}
        </h4>
        <EmptyState title={t('stats.playoutTooSmall')} compact />
      </div>
    );
  }

  return (
    <div className="space-y-4 min-w-0">
      <div className="flex items-center justify-between gap-3">
        <h4 className="font-semibold text-sm text-fg-secondary flex items-center gap-2">
          <LuDices className="text-accent" />
          {t('stats.playout')}
        </h4>
        <button
          type="button"
          onClick={reroll}
          className="flex items-center gap-1.5 text-[11px] font-semibold text-fg-muted hover:text-accent transition-colors"
        >
          <LuRedo2 className="text-[9px]" />
          {t('stats.playoutRerun')}
        </button>
      </div>
      <p className="text-xs text-fg-muted">{t('stats.playoutExplanation', { runs: result.runs, turns: TURNS })}</p>

      <div className="grid grid-cols-3 gap-3">
        <div className="stat-tile" title={t('stats.playoutMulliganHelp')}>
          <span className="stat-tile-label">{t('stats.playoutMulligan')}</span>
          <span className="text-base font-semibold text-fg-secondary tabular-nums">{percent(result.mulliganRate)}</span>
        </div>
        <div className="stat-tile" title={t('stats.playoutStalledHelp')}>
          <span className="stat-tile-label">{t('stats.playoutStalled')}</span>
          <span className="text-base font-semibold text-warning tabular-nums">{percent(result.stalledRate)}</span>
        </div>
        <div className="stat-tile" title={t('stats.playoutOnCurveHelp')}>
          <span className="stat-tile-label">{t('stats.playoutOnCurve')}</span>
          <span className="text-base font-semibold text-accent tabular-nums">{percent(result.onCurveShare)}</span>
        </div>
      </div>

      <div className="space-y-2">
        <span className="stat-tile-label" title={t('stats.playoutKeptHandsHelp')}>
          {t('stats.playoutKeptHands')}
        </span>
        {result.keptHandSizes.map(({ size, share }) => (
          <div key={size} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-fg-secondary">{t('stats.playoutHandOf', { size })}</span>
              <span className="font-semibold tabular-nums text-fg-secondary">{percent(share)}</span>
            </div>
            <ShareBar share={share} />
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <span className="stat-tile-label" title={t('stats.playoutLandMilestonesHelp')}>
          {t('stats.playoutLandMilestones')}
        </span>
        {result.landMilestones.map(({ lands, medianTurn, reachedShare }) => (
          <div key={lands} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-fg-secondary">{t('stats.playoutLandsCount', { lands })}</span>
              <span className="font-semibold tabular-nums text-fg-secondary">
                {medianTurn === null
                  ? t('stats.playoutNeverReached')
                  : t('stats.playoutByTurn', { turn: medianTurn, share: Math.round(reachedShare * 100) })}
              </span>
            </div>
            <ShareBar share={reachedShare} tone={reachedShare < 0.8 ? 'warning' : 'primary'} />
          </div>
        ))}
      </div>

      {/* The simulation does not read card text; saying so beats letting the numbers imply
          more precision than they carry. */}
      <p className="text-[11px] text-fg-muted leading-relaxed">{t('stats.playoutCaveat')}</p>
    </div>
  );
}
