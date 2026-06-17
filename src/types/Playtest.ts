import { Card } from './Card';

export interface PlaytestCard {
  playtestId: string; // Unique ID to track card instances independently in simulator
  card: Card;
  isTapped: boolean;
  counters?: number;
  isFaceDown?: boolean;
}

export interface LogEntry {
  id: string;
  text: string;
  timestamp: string;
}
