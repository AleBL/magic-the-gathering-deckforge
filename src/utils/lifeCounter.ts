/** A table game tracked by the life counter: players, life totals and the other counters. */
export interface TablePlayer {
  id: number;
  name: string;
  life: number;
  poison: number;
  energy: number;
  /** Commander damage taken, keyed by the id of the player whose commander dealt it. */
  commanderDamage: Record<number, number>;
}

export interface TableGame {
  startingLife: number;
  players: TablePlayer[];
}

export const STARTING_LIFE_OPTIONS = [20, 30, 40] as const;
export const PLAYER_COUNT_OPTIONS = [2, 3, 4] as const;

/** The rules' loss thresholds, used to mark a player as out without removing them. */
export const POISON_LIMIT = 10;
export const COMMANDER_DAMAGE_LIMIT = 21;

export function newGame(playerCount: number, startingLife: number, names: (index: number) => string): TableGame {
  return {
    startingLife,
    players: Array.from({ length: playerCount }, (_, index) => ({
      id: index,
      name: names(index),
      life: startingLife,
      poison: 0,
      energy: 0,
      commanderDamage: {}
    }))
  };
}

type Counter = 'life' | 'poison' | 'energy';

export function adjust(game: TableGame, playerId: number, counter: Counter, delta: number): TableGame {
  return {
    ...game,
    players: game.players.map((player) => {
      if (player.id !== playerId) return player;
      const next = player[counter] + delta;
      // Life can go below zero (it matters for some effects); the other counters cannot.
      return { ...player, [counter]: counter === 'life' ? next : Math.max(0, next) };
    })
  };
}

/** Commander damage also costs the same amount of life, as the rule says. */
export function adjustCommanderDamage(game: TableGame, playerId: number, sourceId: number, delta: number): TableGame {
  return {
    ...game,
    players: game.players.map((player) => {
      if (player.id !== playerId) return player;
      const current = player.commanderDamage[sourceId] ?? 0;
      const next = Math.max(0, current + delta);
      const applied = next - current;
      return {
        ...player,
        life: player.life - applied,
        commanderDamage: { ...player.commanderDamage, [sourceId]: next }
      };
    })
  };
}

export function isOut(player: TablePlayer): boolean {
  return (
    player.life <= 0 ||
    player.poison >= POISON_LIMIT ||
    Object.values(player.commanderDamage).some((damage) => damage >= COMMANDER_DAMAGE_LIMIT)
  );
}

export function isTableGame(value: unknown): value is TableGame {
  if (!value || typeof value !== 'object') return false;
  const game = value as Partial<TableGame>;
  return (
    typeof game.startingLife === 'number' &&
    Array.isArray(game.players) &&
    game.players.every((player) => typeof player?.life === 'number' && typeof player?.name === 'string')
  );
}
