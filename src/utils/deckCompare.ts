import { Card } from '../types/Card';
import { DeckZone } from '../types/enums';
import { diffDeckVersions } from './deckVersionDiff';

export interface CompareEntry {
  name: string;
  count: number;
}

export interface CountDifference {
  name: string;
  left: number;
  right: number;
}

export interface DeckComparison {
  onlyLeft: CompareEntry[];
  onlyRight: CompareEntry[];
  different: CountDifference[];
  /** Card names both decks run at the same count. */
  shared: number;
}

const mainDeck = (cards: Card[]) => cards.filter((card) => (card.zone ?? DeckZone.MAIN) === DeckZone.MAIN);

const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name);

/**
 * Compares two main decks by card name, built on the version diff: what one deck runs that the
 * other does not, and where both run a card at different counts.
 */
export function compareDecks(left: Card[], right: Card[]): DeckComparison {
  const leftMain = mainDeck(left);
  const rightMain = mainDeck(right);
  const changes = diffDeckVersions({ name: '', cards: leftMain }, { name: '', cards: rightMain });

  const onlyLeft: CompareEntry[] = [];
  const onlyRight: CompareEntry[] = [];
  const different: CountDifference[] = [];
  for (const change of changes) {
    if (change.type === 'removed') onlyLeft.push({ name: change.name, count: Number(change.from) });
    else if (change.type === 'added') onlyRight.push({ name: change.name, count: Number(change.to) });
    else if (change.type === 'increased' || change.type === 'decreased')
      different.push({ name: change.name, left: Number(change.from), right: Number(change.to) });
  }

  const leftNames = new Set(leftMain.map((card) => card.name));
  const rightNames = new Set(rightMain.map((card) => card.name));
  const differentNames = new Set(different.map((entry) => entry.name));
  const shared = [...leftNames].filter((name) => rightNames.has(name) && !differentNames.has(name)).length;

  return {
    onlyLeft: onlyLeft.sort(byName),
    onlyRight: onlyRight.sort(byName),
    different: different.sort(byName),
    shared
  };
}
