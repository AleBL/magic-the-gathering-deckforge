export type CardSize = 'small' | 'medium' | 'large' | 'xlarge';

export interface SearchFilters {
  colors: string[];
  types: string[];
  rarity: string;
  cmc: string;
}
export * from './enums';
