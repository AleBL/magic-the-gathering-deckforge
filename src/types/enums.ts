export const AlertVariant = {
  DANGER: 'danger',
  WARNING: 'warning',
  SUCCESS: 'success',
  INFO: 'info'
} as const;

export type AlertVariant = typeof AlertVariant[keyof typeof AlertVariant];

export const DeckFormatType = {
  STANDARD: 'standard',
  MODERN: 'modern',
  COMMANDER: 'commander',
  VINTAGE: 'vintage',
  PAUPER: 'pauper',
  FREEFORM: 'freeform'
} as const;

export type DeckFormatType = typeof DeckFormatType[keyof typeof DeckFormatType];

export const ManaColor = {
  WHITE: 'W',
  BLUE: 'U',
  BLACK: 'B',
  RED: 'R',
  GREEN: 'G',
  COLORLESS: 'C'
} as const;

export type ManaColor = typeof ManaColor[keyof typeof ManaColor];

export const DeckZone = {
  MAIN: 'main',
  SIDEBOARD: 'sideboard',
  MAYBEBOARD: 'maybeboard',
  TOKENS: 'tokens'
} as const;

export type DeckZone = typeof DeckZone[keyof typeof DeckZone];

export const PrintZoneFilter = {
  ALL: 'all',
  MAIN: DeckZone.MAIN,
  SIDEBOARD: DeckZone.SIDEBOARD,
  MAYBEBOARD: DeckZone.MAYBEBOARD,
  TOKENS: DeckZone.TOKENS,
  MAIN_TOKENS: `${DeckZone.MAIN}+${DeckZone.TOKENS}`,
  SIDEBOARD_TOKENS: `${DeckZone.SIDEBOARD}+${DeckZone.TOKENS}`,
  MAYBEBOARD_TOKENS: `${DeckZone.MAYBEBOARD}+${DeckZone.TOKENS}`,
  MAIN_SIDEBOARD: `${DeckZone.MAIN}+${DeckZone.SIDEBOARD}`,
  MAIN_MAYBEBOARD: `${DeckZone.MAIN}+${DeckZone.MAYBEBOARD}`,
  SIDEBOARD_MAYBEBOARD: `${DeckZone.SIDEBOARD}+${DeckZone.MAYBEBOARD}`,
  MAIN_SIDEBOARD_MAYBEBOARD: `${DeckZone.MAIN}+${DeckZone.SIDEBOARD}+${DeckZone.MAYBEBOARD}`
} as const;

export type PrintZoneFilter = typeof PrintZoneFilter[keyof typeof PrintZoneFilter];

export const GroupCriteria = {
  NONE: 'none',
  TYPE: 'type',
  CMC: 'cmc',
  COLOR: 'color'
} as const;

export type GroupCriteria = typeof GroupCriteria[keyof typeof GroupCriteria];

export const SortCriteria = {
  NAME: 'name',
  CMC: 'cmc',
  RARITY: 'rarity'
} as const;

export type SortCriteria = typeof SortCriteria[keyof typeof SortCriteria];

export const PlaytestZone = {
  HAND: 'hand',
  BATTLEFIELD: 'battlefield',
  LIBRARY_TOP: 'libraryTop',
  LIBRARY_BOTTOM: 'libraryBottom',
  GRAVEYARD: 'graveyard',
  EXILE: 'exile',
  COMMAND_ZONE: 'commandZone'
} as const;

export type PlaytestZone = typeof PlaytestZone[keyof typeof PlaytestZone];
