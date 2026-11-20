import { MatchRecord } from '../types/Deck';

export interface Record3 {
  wins: number;
  losses: number;
  draws: number;
  games: number;
  /** Wins over decided games (draws left out), or null before any decided game. */
  winRate: number | null;
}

export interface MatchupRow extends Record3 {
  opponent: string;
}

function tally(matches: MatchRecord[]): Record3 {
  const wins = matches.filter((match) => match.result === 'win').length;
  const losses = matches.filter((match) => match.result === 'loss').length;
  const draws = matches.length - wins - losses;
  const decided = wins + losses;
  return { wins, losses, draws, games: matches.length, winRate: decided > 0 ? wins / decided : null };
}

export function matchSummary(matches: MatchRecord[]) {
  const onPlay = matches.filter((match) => match.onPlay);
  const onDraw = matches.filter((match) => !match.onPlay);
  return { overall: tally(matches), onPlay: tally(onPlay), onDraw: tally(onDraw) };
}

/**
 * Win rate by opponent, grouped case-insensitively, most played first. The spelling of the
 * first game logged names the group, so the label does not change as games are added.
 */
export function matchupTable(matches: MatchRecord[]): MatchupRow[] {
  const groups = new Map<string, { label: string; matches: MatchRecord[] }>();
  const chronological = [...matches].sort((a, b) => a.playedAt.localeCompare(b.playedAt));
  for (const match of chronological) {
    const label = match.opponent.trim();
    const key = label.toLowerCase();
    const group = groups.get(key) ?? { label, matches: [] };
    group.matches.push(match);
    groups.set(key, group);
  }
  return [...groups.values()]
    .map((group) => ({ opponent: group.label, ...tally(group.matches) }))
    .sort((a, b) => b.games - a.games || a.opponent.localeCompare(b.opponent));
}
