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
  set_name: string;
  image_uris?: {
    small: string;
    normal: string;
    large: string;
    png: string;
    gatherer?: string;
  };
  card_faces?: Array<{
    name: string;
    type_line: string;
    oracle_text?: string;
    printed_text?: string;
    printed_type_line?: string;
    mana_cost?: string;
    image_uris?: {
      small: string;
      normal: string;
      large: string;
      png: string;
    };
  }>;
}
