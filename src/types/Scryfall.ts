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

/** An identifier from a `/cards/collection` request that Scryfall could not resolve. */
export interface ScryfallNotFoundIdentifier {
  id?: string;
  name?: string;
  set?: string;
  collector_number?: string;
}

export interface ScryfallCollectionResponse {
  data?: Card[];
  not_found?: ScryfallNotFoundIdentifier[];
}

export interface CardWithScryfallMetadata extends Card {
  all_parts?: ScryfallCardPart[];
  printed_text?: string;
  collector_number?: string;
  artist?: string;
}
