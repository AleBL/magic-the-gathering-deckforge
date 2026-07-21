export type CardSize = 'small' | 'medium' | 'large' | 'xlarge';

export type AppTab = 'search' | 'deck' | 'collection';

export interface SearchFilters {
  colors: string[];
  types: string[];
  rarity: string;
  cmc: string;
}
export * from './enums';
