import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useTranslation } from 'react-i18next';
import { LuNotebookPen, LuTrash2 } from 'react-icons/lu';
import { db } from '../../db/database';
import { MatchRecord, MatchResult } from '../../types/Deck';
import { newId } from '../../utils/id';
import { matchSummary, matchupTable } from '../../utils/matchStats';
import { logger } from '../../utils/logger';

interface MatchLogPanelProps {
  deckId: string;
}

const RESULTS: MatchResult[] = ['win', 'loss', 'draw'];

const percent = (rate: number | null) => (rate === null ? '—' : `${Math.round(rate * 100)}%`);

/**
 * A diary of games played with a saved deck: result, opponent, play or draw. It turns into a
 * win rate overall, on the play and on the draw, and by matchup.
 */
function MatchLogPanel({ deckId }: MatchLogPanelProps) {
  const { t, i18n } = useTranslation();
  const matches = useLiveQuery(
    () => db.matches.where('deckId').equals(deckId).reverse().sortBy('playedAt'),
    [deckId],
    [] as MatchRecord[]
  );
  const [result, setResult] = useState<MatchResult>('win');
  const [opponent, setOpponent] = useState('');
  const [onPlay, setOnPlay] = useState(true);
  const [notes, setNotes] = useState('');

  const summary = matchSummary(matches);
  const matchups = matchupTable(matches);
  const knownOpponents = matchups.map((row) => row.opponent).filter(Boolean);

  const logGame = async () => {
    const record: MatchRecord = {
      id: newId(),
      deckId,
      result,
      opponent: opponent.trim(),
      onPlay,
      notes: notes.trim() || undefined,
      playedAt: new Date().toISOString()
    };
    try {
      await db.matches.put(record);
      setNotes('');
    } catch (error) {
      logger.error('Failed to log the game:', error);
    }
  };

  return (
    <section className="md:col-span-3 space-y-4 p-4 rounded-xl border border-line bg-surface-1">
      <h3 className="flex items-center gap-2 text-sm font-medium text-fg">
        <LuNotebookPen className="text-fg-muted" aria-hidden="true" />
        {t('matchLog.title')}
      </h3>

      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          void logGame();
        }}
      >
        <fieldset className="flex gap-1" aria-label={t('matchLog.result')}>
          {RESULTS.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={result === option}
              onClick={() => setResult(option)}
              className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                result === option
                  ? 'border-fg bg-primary text-on-primary'
                  : 'border-line-strong text-fg-secondary hover:bg-surface-2'
              }`}
            >
              {t(`matchLog.results.${option}`)}
            </button>
          ))}
        </fieldset>
        <label className="flex min-w-40 flex-1 flex-col gap-1 text-xs text-fg-muted">
          {t('matchLog.opponent')}
          <input
            value={opponent}
            onChange={(event) => setOpponent(event.target.value)}
            list={`opponents-${deckId}`}
            placeholder={t('matchLog.opponentPlaceholder')}
            className="h-9 rounded-lg border border-line-strong bg-surface-1 px-2 text-sm text-fg placeholder:text-fg-muted"
          />
          <datalist id={`opponents-${deckId}`}>
            {knownOpponents.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </label>
        <label className="flex items-center gap-2 text-sm text-fg-secondary">
          <input type="checkbox" checked={onPlay} onChange={(event) => setOnPlay(event.target.checked)} />
          {t('matchLog.onPlay')}
        </label>
        <label className="flex min-w-40 flex-1 flex-col gap-1 text-xs text-fg-muted">
          {t('matchLog.notes')}
          <input
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className="h-9 rounded-lg border border-line-strong bg-surface-1 px-2 text-sm text-fg"
          />
        </label>
        <button type="submit" className="primary-button">
          {t('matchLog.logGame')}
        </button>
      </form>

      {matches.length === 0 ? (
        <p className="text-sm text-fg-muted">{t('matchLog.empty')}</p>
      ) : (
        <>
          <dl className="grid grid-cols-3 gap-3 text-sm">
            {(
              [
                ['overall', summary.overall],
                ['onPlayRate', summary.onPlay],
                ['onDrawRate', summary.onDraw]
              ] as const
            ).map(([key, record]) => (
              <div key={key} className="rounded-lg border border-line p-3">
                <dt className="text-xs text-fg-muted">{t(`matchLog.${key}`)}</dt>
                <dd className="text-xl font-semibold text-fg">{percent(record.winRate)}</dd>
                <dd className="text-xs text-fg-muted">
                  {t('matchLog.record', { wins: record.wins, losses: record.losses, draws: record.draws })}
                </dd>
              </div>
            ))}
          </dl>

          <table className="w-full text-sm">
            <caption className="mb-1 text-left text-xs text-fg-muted">{t('matchLog.byMatchup')}</caption>
            <thead>
              <tr className="text-left text-xs text-fg-muted">
                <th className="py-1 font-normal">{t('matchLog.opponent')}</th>
                <th className="py-1 font-normal text-right">{t('matchLog.games')}</th>
                <th className="py-1 font-normal text-right">{t('matchLog.winRate')}</th>
              </tr>
            </thead>
            <tbody>
              {matchups.map((row) => (
                <tr key={row.opponent} className="border-t border-line">
                  <td className="py-1.5 text-fg">{row.opponent || t('matchLog.unknownOpponent')}</td>
                  <td className="py-1.5 text-right text-fg-secondary">{row.games}</td>
                  <td className="py-1.5 text-right text-fg">{percent(row.winRate)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <ol className="space-y-1 text-sm" aria-label={t('matchLog.recent')}>
            {matches.slice(0, 10).map((match) => (
              <li key={match.id} className="flex items-center gap-3 border-t border-line pt-1.5">
                <span className="w-16 shrink-0 text-fg">{t(`matchLog.results.${match.result}`)}</span>
                <span className="min-w-0 flex-1 truncate text-fg-secondary">
                  {match.opponent || t('matchLog.unknownOpponent')}
                  {match.notes ? <span className="ml-2 text-fg-muted">{match.notes}</span> : null}
                </span>
                <span className="shrink-0 text-xs text-fg-muted">
                  {match.onPlay ? t('matchLog.play') : t('matchLog.draw')}
                </span>
                <time dateTime={match.playedAt} className="shrink-0 text-xs text-fg-muted">
                  {new Date(match.playedAt).toLocaleDateString(i18n.language)}
                </time>
                <button
                  type="button"
                  onClick={() => void db.matches.delete(match.id)}
                  aria-label={t('matchLog.delete')}
                  className="shrink-0 rounded p-1 text-fg-muted hover:text-danger"
                >
                  <LuTrash2 aria-hidden="true" />
                </button>
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  );
}

export default MatchLogPanel;
