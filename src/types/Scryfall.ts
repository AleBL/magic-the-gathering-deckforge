import { Card } from './Card';

export interface ScryfallCardPart {
  id: string;
  object: string;
  component: string;
  name: string;
  type_line: string;
  uri: string;
}

export interface ScryfallSearchResponse {
  data?: Card[];
}

export interface CardWithScryfallMetadata extends Card {
  all_parts?: ScryfallCardPart[];
  printed_text?: string;
  collector_number?: string;
  artist?: string;
}
