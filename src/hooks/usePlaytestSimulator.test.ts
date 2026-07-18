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

const faceImages = (url: string) => ({ small: url, normal: url, large: url, png: url });

const makeDfcCard = (id: string): Card =>
  makeCard({
    id,
    name: 'Delver of Secrets // Insectile Aberration',
    type_line: 'Creature — Human Wizard // Creature — Human Insect',
    card_faces: [
      {
        name: 'Delver of Secrets',
        type_line: 'Creature — Human Wizard',
        mana_cost: '{U}',
        power: '1',
        toughness: '1',
        image_uris: faceImages('front.jpg')
      },
      {
        name: 'Insectile Aberration',
        type_line: 'Creature — Human Insect',
        power: '3',
        toughness: '2',
        image_uris: faceImages('back.jpg')
      }
    ]
  });

const dfcDeck = (n: number): Card[] => Array.from({ length: n }, (_, i) => makeDfcCard(`dfc-${i}`));

describe('usePlaytestSimulator — double-faced cards (DFC/MDFC)', () => {
  it('defers playing a double-faced card until a face is chosen', () => {
    const { result } = renderHook(() => usePlaytestSimulator(dfcDeck(10)));
    act(() => result.current.startSimulation());

    const cardId = result.current.hand[0].playtestId;
    act(() => result.current.handlePlayCard(cardId));

    expect(result.current.pendingFaceChoice?.playtestId).toBe(cardId);
    expect(result.current.hand.some((c) => c.playtestId === cardId)).toBe(true);
    expect(result.current.battlefield).toHaveLength(0);
  });

  it('puts the chosen back face onto the battlefield with that face characteristics', () => {
    const { result } = renderHook(() => usePlaytestSimulator(dfcDeck(10)));
    act(() => result.current.startSimulation());

    const cardId = result.current.hand[0].playtestId;
    act(() => result.current.handlePlayCard(cardId));
    act(() => result.current.handleChooseFace(1));

    expect(result.current.pendingFaceChoice).toBeNull();
    expect(result.current.hand.some((c) => c.playtestId === cardId)).toBe(false);
    const played = result.current.battlefield.find((c) => c.playtestId === cardId);
    expect(played?.card.name).toBe('Insectile Aberration');
    expect(played?.card.type_line).toBe('Creature — Human Insect');
    expect(played?.card.power).toBe('3');
    expect(played?.card.image_uris?.normal).toBe('back.jpg');
  });

  it('puts the chosen front face onto the battlefield with front-face characteristics', () => {
    const { result } = renderHook(() => usePlaytestSimulator(dfcDeck(10)));
    act(() => result.current.startSimulation());

    const cardId = result.current.hand[0].playtestId;
    act(() => result.current.handlePlayCard(cardId));
    act(() => result.current.handleChooseFace(0));

    const played = result.current.battlefield.find((c) => c.playtestId === cardId);
    expect(played?.card.name).toBe('Delver of Secrets');
    expect(played?.card.mana_cost).toBe('{U}');
  });

  it('restores the full double-faced card when it leaves the battlefield', () => {
    const { result } = renderHook(() => usePlaytestSimulator(dfcDeck(10)));
    act(() => result.current.startSimulation());

    const cardId = result.current.hand[0].playtestId;
    act(() => result.current.handlePlayCard(cardId));
    act(() => result.current.handleChooseFace(1));
    act(() => result.current.handleSendToGraveyard(cardId));

    const inGraveyard = result.current.graveyard.find((c) => c.playtestId === cardId);
    expect(inGraveyard?.card.name).toBe('Delver of Secrets // Insectile Aberration');
    expect(inGraveyard?.card.card_faces).toHaveLength(2);
  });

  it('keeps the card in hand when the face choice is cancelled', () => {
    const { result } = renderHook(() => usePlaytestSimulator(dfcDeck(10)));
    act(() => result.current.startSimulation());

    const cardId = result.current.hand[0].playtestId;
    act(() => result.current.handlePlayCard(cardId));
    act(() => result.current.handleCancelFaceChoice());

    expect(result.current.pendingFaceChoice).toBeNull();
    expect(result.current.hand.some((c) => c.playtestId === cardId)).toBe(true);
    expect(result.current.battlefield).toHaveLength(0);
  });

  it('still plays single-faced cards immediately without a face prompt', () => {
    const { result } = renderHook(() => usePlaytestSimulator(deckOf(10)));
    act(() => result.current.startSimulation());

    const cardId = result.current.hand[0].playtestId;
    act(() => result.current.handlePlayCard(cardId));

    expect(result.current.pendingFaceChoice ?? null).toBeNull();
    expect(result.current.battlefield.some((c) => c.playtestId === cardId)).toBe(true);
  });
});
