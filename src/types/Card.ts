export interface Card {
  printed_name: string;
  id: string;
  oracle_id: string;
  name: string;
  printed_text?: string;
  type_line: string;
  printed_type_line?: string;
  oracle_text?: string;
  mana_cost?: string;
  cmc?: number;
  power?: string;
  toughness?: string;
  rarity: string;
  set?: string;
  set_name: string;
  image_uris?: {
    small: string;
    normal: string;
    large: string;
    png: string;
    gatherer?: string;
  };
  prices?: {
    usd?: string | null;
    usd_foil?: string | null;
    eur?: string | null;
    eur_foil?: string | null;
    tix?: string | null;
  };
  legalities?: {
    standard: string;
    modern: string;
    legacy: string;
    commander: string;
    pauper: string;
    vintage: string;
    pioneer: string;
  };
  card_faces?: Array<{
    name: string;
    printed_name?: string;
    type_line: string;
    printed_type_line?: string;
    oracle_text?: string;
    printed_text?: string;
    mana_cost?: string;
    power?: string;
    toughness?: string;
    image_uris?: {
      small: string;
      normal: string;
      large: string;
      png: string;
    };
  }>;
  colors?: string[];
  color_identity?: string[];
  isCommander?: boolean;
  zone?: 'main' | 'sideboard' | 'maybeboard';
  selectedPrintId?: string;
  selectedPrintImageUri?: string;
  collector_number?: string;
  artist?: string;
}
