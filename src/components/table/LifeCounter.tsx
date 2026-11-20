import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LuMinus, LuPlus, LuRotateCcw, LuX } from 'react-icons/lu';
import { STORAGE_KEYS } from '../../constants/storage';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useWakeLock } from '../../hooks/useWakeLock';
import {
  adjust,
  adjustCommanderDamage,
  isOut,
  isTableGame,
  newGame,
  PLAYER_COUNT_OPTIONS,
  STARTING_LIFE_OPTIONS,
  TableGame,
  TablePlayer
} from '../../utils/lifeCounter';

interface LifeCounterProps {
  onClose: () => void;
}

function readStoredGame(): TableGame | null {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEYS.tableGame) ?? 'null');
    return isTableGame(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function StepButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-md border border-line-strong bg-surface-1 text-fg-secondary hover:bg-surface-2 active:scale-[0.97] transition-colors"
    >
      {children}
    </button>
  );
}

function PlayerPanel({
  player,
  game,
  flipped,
  onChange
}: {
  player: TablePlayer;
  game: TableGame;
  flipped: boolean;
  onChange: (next: TableGame) => void;
}) {
  const { t } = useTranslation();
  const out = isOut(player);
  const opponents = game.players.filter((other) => other.id !== player.id);
  const showCommander = game.startingLife >= 40;

  return (
    <section
      aria-label={player.name}
      className={`relative flex min-h-0 flex-col rounded-xl border border-line bg-surface-1 p-3 ${flipped ? 'max-sm:rotate-180' : ''} ${out ? 'opacity-60' : ''}`}
    >
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="font-medium text-fg">{player.name}</span>
        {out ? <span className="text-danger">{t('lifeCounter.out')}</span> : null}
      </div>

      {/* The life total fills the panel; each half is a big tap target for -1 / +1. */}
      <div className="relative flex flex-1 items-center justify-center py-2">
        <button
          type="button"
          onClick={() => onChange(adjust(game, player.id, 'life', -1))}
          aria-label={t('lifeCounter.loseLife', { name: player.name })}
          className="absolute inset-y-0 left-0 w-1/2 rounded-l-lg hover:bg-surface-2 transition-colors"
        >
          <LuMinus className="ml-4 text-2xl text-fg-muted" aria-hidden="true" />
        </button>
        <span className="pointer-events-none select-none font-serif text-7xl font-semibold text-fg" aria-live="polite">
          {player.life}
        </span>
        <button
          type="button"
          onClick={() => onChange(adjust(game, player.id, 'life', 1))}
          aria-label={t('lifeCounter.gainLife', { name: player.name })}
          className="absolute inset-y-0 right-0 flex w-1/2 items-center justify-end rounded-r-lg hover:bg-surface-2 transition-colors"
        >
          <LuPlus className="mr-4 text-2xl text-fg-muted" aria-hidden="true" />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        {(['poison', 'energy'] as const).map((counter) => (
          <div key={counter} className="flex items-center gap-1.5">
            <StepButton
              label={t(`lifeCounter.remove.${counter}`, { name: player.name })}
              onClick={() => onChange(adjust(game, player.id, counter, -1))}
            >
              <LuMinus aria-hidden="true" />
            </StepButton>
            <span className="min-w-14 text-center text-fg-secondary">
              {t(`lifeCounter.${counter}`)} {player[counter]}
            </span>
            <StepButton
              label={t(`lifeCounter.add.${counter}`, { name: player.name })}
              onClick={() => onChange(adjust(game, player.id, counter, 1))}
            >
              <LuPlus aria-hidden="true" />
            </StepButton>
          </div>
        ))}
      </div>

      {showCommander ? (
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          {opponents.map((opponent) => (
            <div key={opponent.id} className="flex items-center gap-1 rounded-md border border-line px-1.5 py-1">
              <span className="text-fg-muted">{t('lifeCounter.commanderFrom', { name: opponent.name })}</span>
              <button
                type="button"
                onClick={() => onChange(adjustCommanderDamage(game, player.id, opponent.id, -1))}
                aria-label={t('lifeCounter.removeCommanderDamage', { name: player.name, source: opponent.name })}
                className="px-1 text-fg-secondary hover:text-fg"
              >
                <LuMinus aria-hidden="true" />
              </button>
              <span className="min-w-5 text-center text-fg">{player.commanderDamage[opponent.id] ?? 0}</span>
              <button
                type="button"
                onClick={() => onChange(adjustCommanderDamage(game, player.id, opponent.id, 1))}
                aria-label={t('lifeCounter.addCommanderDamage', { name: player.name, source: opponent.name })}
                className="px-1 text-fg-secondary hover:text-fg"
              >
                <LuPlus aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

/**
 * Table mode: a life counter for 2 to 4 players, with poison, energy and commander damage,
 * that keeps the screen awake while open. The game is kept locally, so closing the counter by
 * accident does not lose it.
 */
function LifeCounter({ onClose }: LifeCounterProps) {
  const { t } = useTranslation();
  const dialogRef = useFocusTrap<HTMLDivElement>(true);
  useEscapeKey(onClose, true);
  const keepsScreenOn = useWakeLock(true);
  const playerName = (index: number) => t('lifeCounter.playerName', { number: index + 1 });
  const [game, setGame] = useState<TableGame>(() => readStoredGame() ?? newGame(2, 20, playerName));

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.tableGame, JSON.stringify(game));
    } catch {
      // Private mode: the game lives in memory only.
    }
  }, [game]);

  const restart = (playerCount = game.players.length, startingLife = game.startingLife) =>
    setGame(newGame(playerCount, startingLife, playerName));

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="life-counter-title"
      className="fixed inset-0 z-[var(--z-modal)] flex flex-col gap-3 bg-surface-0 p-3 sm:p-4"
    >
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="life-counter-title" className="font-serif text-xl font-semibold text-fg">
          {t('lifeCounter.title')}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm text-fg-secondary">
            <span className="sr-only">{t('lifeCounter.players')}</span>
            <select
              value={game.players.length}
              onChange={(event) => restart(Number(event.target.value))}
              className="h-9 rounded-lg border border-line-strong bg-surface-1 px-2 text-sm text-fg"
            >
              {PLAYER_COUNT_OPTIONS.map((count) => (
                <option key={count} value={count}>
                  {t('lifeCounter.playerCount', { count })}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-fg-secondary">
            <span className="sr-only">{t('lifeCounter.startingLife')}</span>
            <select
              value={game.startingLife}
              onChange={(event) => restart(game.players.length, Number(event.target.value))}
              className="h-9 rounded-lg border border-line-strong bg-surface-1 px-2 text-sm text-fg"
            >
              {STARTING_LIFE_OPTIONS.map((life) => (
                <option key={life} value={life}>
                  {t('lifeCounter.lifeOption', { life })}
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="secondary-button" onClick={() => restart()}>
            <LuRotateCcw aria-hidden="true" />
            {t('lifeCounter.newGame')}
          </button>
          <button type="button" className="ghost-button px-2" onClick={onClose} aria-label={t('common.close')}>
            <LuX aria-hidden="true" />
          </button>
        </div>
      </header>

      <div
        className={`grid min-h-0 flex-1 gap-3 ${game.players.length === 2 ? 'grid-rows-2 sm:grid-rows-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'}`}
      >
        {game.players.map((player, index) => (
          <PlayerPanel
            key={player.id}
            player={player}
            game={game}
            // Face to face on a phone: the first player's panel reads from the other side.
            flipped={game.players.length === 2 && index === 0}
            onChange={setGame}
          />
        ))}
      </div>

      {!keepsScreenOn ? <p className="text-xs text-fg-muted">{t('lifeCounter.noWakeLock')}</p> : null}
    </div>
  );
}

export default LifeCounter;
