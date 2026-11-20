# Product

**MTG Deck Forge** is an offline-first workbench for building, testing and maintaining
Magic: The Gathering decks and a card collection. It runs as a desktop app (Electron) and
as an installable web app (PWA), in English, Spanish and Portuguese.

## Who it is for

Players who build their own decks: they search cards, assemble and tune lists, check
legality and mana, goldfish a few hands, and track what they own. Sessions are long and
repetitive (search, add, check, adjust), often on a laptop next to a physical collection,
sometimes on a phone at the table.

## Surface mode

Every screen is **Operate**: the visitor came to finish a task. Scanability, consistency
and familiar controls outrank expression. The world shows in type, palette, density and
one signature detail, never in the layout or the controls.

## Jobs, in order of frequency

1. Find a card (search, filters, card detail with printings).
2. Build and edit a deck (zones, quantities, commander, notes, versions).
3. Check a deck (validation, statistics, Deck Doctor, mana base).
4. Test a deck (playtest simulator, opening hands).
5. Keep the collection (owned, wishlist, imports).

## Constraints

- Offline first: data lives in IndexedDB (Dexie); Scryfall is the only network dependency
  and can be slow or down. The UI must stay honest about that.
- Card data, symbols and images come from Scryfall. Never use Wizards of the Coast
  trademarks as UI decoration, never Beleren or other licensed fonts.
- Three locales in parity (`yarn i18n:check`); copy changes touch all three.
- Card art is the richest content on screen. The chrome stays quiet so the art can lead.

## Voice

Plain and exact, like a rules reference. Short labels in sentence case, no exclamation
marks, no hype. Errors name the problem and the next step, and never blame a service for a
failure the app cannot attribute to it.
