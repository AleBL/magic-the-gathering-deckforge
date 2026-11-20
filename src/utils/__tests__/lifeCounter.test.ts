import { describe, expect, it } from 'vitest';
import { adjust, adjustCommanderDamage, isOut, isTableGame, newGame } from '../lifeCounter';

const game = () => newGame(4, 40, (index) => `Player ${index + 1}`);

describe('lifeCounter', () => {
  it('starts every player at the chosen life with clean counters', () => {
    const table = game();
    expect(table.players).toHaveLength(4);
    expect(table.players.every((player) => player.life === 40 && player.poison === 0)).toBe(true);
  });

  it('lets life go below zero but keeps poison and energy at zero or more', () => {
    let table = adjust(game(), 0, 'life', -45);
    table = adjust(table, 0, 'poison', -1);
    expect(table.players[0].life).toBe(-5);
    expect(table.players[0].poison).toBe(0);
  });

  it('charges commander damage to life as well', () => {
    const table = adjustCommanderDamage(game(), 1, 0, 7);
    expect(table.players[1].commanderDamage[0]).toBe(7);
    expect(table.players[1].life).toBe(33);
    const undone = adjustCommanderDamage(table, 1, 0, -10);
    expect(undone.players[1].commanderDamage[0]).toBe(0);
    expect(undone.players[1].life).toBe(40);
  });

  it('marks a player out at zero life, ten poison or 21 from one commander', () => {
    const base = game();
    expect(isOut(adjust(base, 0, 'life', -40).players[0])).toBe(true);
    expect(isOut(adjust(base, 0, 'poison', 10).players[0])).toBe(true);
    expect(isOut(adjustCommanderDamage(base, 0, 2, 21).players[0])).toBe(true);
    expect(isOut(base.players[0])).toBe(false);
  });

  it('recognises a stored game and rejects anything else', () => {
    expect(isTableGame(game())).toBe(true);
    expect(isTableGame({ players: 'x' })).toBe(false);
    expect(isTableGame(null)).toBe(false);
  });
});
