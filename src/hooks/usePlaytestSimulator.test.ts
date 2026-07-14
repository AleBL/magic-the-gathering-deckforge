import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { usePlaytestSimulator } from './usePlaytestSimulator';
import { makeCard } from '../test/factories';
import { Card } from '../types/Card';

const deckOf = (n: number): Card[] =>
  Array.from({ length: n }, (_, i) => makeCard({ id: `deck-${i}`, name: `Card ${i}` }));

describe('usePlaytestSimulator', () => {
  it('deals an opening hand of seven and puts the rest in the library', () => {
    const { result } = renderHook(() => usePlaytestSimulator(deckOf(10)));

    act(() => result.current.startSimulation());

    expect(result.current.hand).toHaveLength(7);
    expect(result.current.library).toHaveLength(3);
    expect(result.current.hand.every((c) => c.isFaceDown === false)).toBe(true);
    expect(result.current.library.every((c) => c.isFaceDown === true)).toBe(true);
  });

  it('does nothing when the deck is empty', () => {
    const { result } = renderHook(() => usePlaytestSimulator([]));

    act(() => result.current.startSimulation());

    expect(result.current.hand).toHaveLength(0);
    expect(result.current.library).toHaveLength(0);
  });

  it('draws the top card of the library into the hand', () => {
    const { result } = renderHook(() => usePlaytestSimulator(deckOf(10)));
    act(() => result.current.startSimulation());

    const topCardId = result.current.library[0].playtestId;
    act(() => result.current.handleDrawCard());

    expect(result.current.library).toHaveLength(2);
    expect(result.current.hand).toHaveLength(8);
    expect(result.current.hand.some((c) => c.playtestId === topCardId)).toBe(true);
  });

  it('shuffling preserves the exact set of library cards', () => {
    const { result } = renderHook(() => usePlaytestSimulator(deckOf(15)));
    act(() => result.current.startSimulation());

    const before = result.current.library.map((c) => c.playtestId).sort();
    act(() => result.current.handleShuffleLibrary());
    const after = result.current.library.map((c) => c.playtestId).sort();

    expect(after).toEqual(before);
  });

  it('plays a card from the hand onto the battlefield', () => {
    const { result } = renderHook(() => usePlaytestSimulator(deckOf(10)));
    act(() => result.current.startSimulation());

    const cardId = result.current.hand[0].playtestId;
    act(() => result.current.handlePlayCard(cardId));

    expect(result.current.hand.some((c) => c.playtestId === cardId)).toBe(false);
    expect(result.current.battlefield.some((c) => c.playtestId === cardId)).toBe(true);
  });

  it('advances the turn and draws for the turn', () => {
    const { result } = renderHook(() => usePlaytestSimulator(deckOf(10)));
    act(() => result.current.startSimulation());
    const libraryBefore = result.current.library.length;
    const handBefore = result.current.hand.length;

    act(() => result.current.handleNextTurn());

    expect(result.current.turn).toBe(2);
    expect(result.current.library).toHaveLength(libraryBefore - 1);
    expect(result.current.hand).toHaveLength(handBefore + 1);
  });

  it('starts Commander games at 40 life', () => {
    const { result } = renderHook(() => usePlaytestSimulator(deckOf(10), 'commander'));

    act(() => result.current.startSimulation());

    expect(result.current.lifeTotal).toBe(40);
  });
});
