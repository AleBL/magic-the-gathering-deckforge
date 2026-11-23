import { describe, expect, it } from 'vitest';
import { matchSummary, matchupTable } from '../matchStats';
import type { MatchRecord, MatchResult } from '../../types/Deck';

let id = 0;
const game = (result: MatchResult, opponent: string, onPlay = true): MatchRecord => ({
  id: String((id += 1)),
  deckId: 'd1',
  result,
  opponent,
  onPlay,
  playedAt: '2026-01-01'
});

describe('matchStats', () => {
  it('counts the win rate over decided games only', () => {
    const { overall } = matchSummary([game('win', 'A'), game('loss', 'A'), game('draw', 'B'), game('win', 'B')]);
    expect(overall).toMatchObject({ wins: 2, losses: 1, draws: 1, games: 4 });
    expect(overall.winRate).toBeCloseTo(2 / 3);
  });

  it('has no win rate before a decided game', () => {
    expect(matchSummary([game('draw', 'A')]).overall.winRate).toBeNull();
    expect(matchSummary([]).overall.winRate).toBeNull();
  });

  it('splits on the play from on the draw', () => {
    const { onPlay, onDraw } = matchSummary([game('win', 'A', true), game('loss', 'A', false)]);
    expect(onPlay.winRate).toBe(1);
    expect(onDraw.winRate).toBe(0);
  });

  it('groups matchups without regard to case, most played first', () => {
    const rows = matchupTable([game('win', 'Mono-red'), game('loss', 'mono-red'), game('win', 'Control')]);
    expect(rows.map((row) => [row.opponent, row.games])).toEqual([
      ['Mono-red', 2],
      ['Control', 1]
    ]);
  });
});
