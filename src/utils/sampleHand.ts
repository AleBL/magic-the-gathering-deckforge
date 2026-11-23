import { Card } from '../types/Card';
import { DeckZone } from '../types/enums';

export const OPENING_HAND_SIZE = 7;

/** The cards a hand is drawn from: the main deck, without commanders (they start in the command zone). */
export function libraryOf(deck: Card[]): Card[] {
  return deck.filter((card) => (card.zone ?? DeckZone.MAIN) === DeckZone.MAIN && !card.isCommander);
}

/** Fisher-Yates over a copy; `random` is injectable so tests can pin the order. */
export function shuffled<T>(items: T[], random: () => number = Math.random): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

export interface SampleHand {
  /** The shuffled library; the hand is its first `handSize + drawn` cards. */
  order: Card[];
  mulligans: number;
  /** Cards drawn after the opening hand, one per "draw" press. */
  drawn: number;
}

export function newHand(deck: Card[], mulligans = 0, random: () => number = Math.random): SampleHand {
  return { order: shuffled(libraryOf(deck), random), mulligans, drawn: 0 };
}

/** London mulligan, simplified for a glance: each mulligan shows one card fewer. */
export function handSize(hand: SampleHand): number {
  return Math.max(0, OPENING_HAND_SIZE - hand.mulligans);
}

export function visibleCards(hand: SampleHand): Card[] {
  return hand.order.slice(0, handSize(hand) + hand.drawn);
}

export function canDraw(hand: SampleHand): boolean {
  return handSize(hand) + hand.drawn < hand.order.length;
}
