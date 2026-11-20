# Design

Direction for every UI change. Token names and values live in
[docs/DESIGN_TOKENS.md](docs/DESIGN_TOKENS.md); this file says what they are for.

## Direction

- **Product.** A workbench to build, test and keep Magic decks and a collection, offline
  first, for players who build their own lists.
- **Character.** Exact, tactile, table-side.
- **World.** The game table and the binder: playmat felt, card stock, printer's ink, matte
  sleeves. Warm graphite neutrals in dark mode, paper in light mode.
- **Moments.** (1) Card art, wherever a card is shown. (2) One main chart per analysis
  screen (mana curve or the Deck Doctor score), drawn with care.
- **Signature.** Mana symbols are the only coloured iconography. Colour appears where it
  means colour identity: pips in filters, the deck library, card rows, the colour chart.
  Everything else is neutral.

## Rules that follow

- **One neutral ramp, three text roles.** Surfaces, borders and text come from the
  semantic roles (`surface-*`, `fg`, `fg-secondary`, `fg-muted`, `line`). The roles switch
  values under `html.dark`, so components do not carry `dark:` pairs for neutrals.
- **Ink primary, brass accent.** The primary button is ink: near-black on paper, near-white
  on graphite, with inverted text. The brass accent marks selection and keyboard focus only.
  Blue, red, green, yellow and purple already mean mana, so the chrome never uses them as
  brand colour.
- **Status keeps meaning.** Success, warning and danger are toned down to sit in the palette
  and always travel with a label or an icon, never colour alone.
- **One button system.** Primary, secondary, ghost, destructive. No colour per action.
  Destructive actions live in menus and ask for confirmation.
- **Glass only on overlays** (command palette, menus). Modals and panels are solid surfaces.
- **No glows.** No coloured shadows, gradient text, halos or radial washes. Depth comes from
  surface steps and hairlines in dark mode, small neutral shadows in light mode.
- **Type.** Inter for the interface, weights 400/500/600, hierarchy by size and colour.
  The display serif is for page and modal titles only. Sentence case everywhere; capitals
  only where the game's own convention uses them. `tabular-nums` on every changing number.
- **Motion.** One curve (`--ease-out`), short durations, named transitions
  (`transition-colors`, `transition-[transform,opacity]`). Loops only for live state
  (loading, syncing). Everything honours `prefers-reduced-motion` and the in-app effects
  toggle.
- **New components** meet the floor before review: tokens only, `:focus-visible` on every
  interactive element, a reduced-motion fallback, no `transition: all`, no tracked capitals.

## Checks

- `yarn style:check` counts the signals above against ceilings that only go down
  (`scripts/style-baseline.json`).
- `yarn test:e2e:visual` captures the main screens in light and dark, desktop and phone,
  into `test-results/visual/` for review by eye before and after each change.
- `e2e/contrast.spec.ts` keeps text roles at WCAG AA in both themes.
