# Design Tokens

Single source of truth for the visual system. All tokens live in the Tailwind v4
`@theme` block at [`src/style/variables.css`](../src/style/variables.css), so each
one automatically generates the matching utility class (`bg-primary`, `text-danger`,
`font-serif`, `shadow-md`, `rounded-xl`, …). **Always reference a token, never a raw
shade** (`bg-blue-600` → `bg-primary`).

Dark mode uses the class strategy (`html.dark`, see
[`useDarkMode`](../src/hooks/useDarkMode.ts)). Colour tokens are **roles**: each one is
declared with its light value in `@theme` and redefined under `html.dark`, so a single
utility (`bg-surface-1`, `text-fg-muted`) re-themes itself. Components do not carry
`dark:` pairs for colour. The direction behind these values is in [DESIGN.md](../DESIGN.md).

`yarn style:check` counts raw palette classes and the other signals the design rules ban,
against ceilings in `scripts/style-baseline.json` that only go down.

---

## Color — neutral ramp

Every Tailwind grey family (`gray`, `slate`, `zinc`) resolves to one warm graphite ramp,
from paper (`50`) to graphite (`950`). Prefer the roles below; the remap only keeps any
leftover raw grey inside the palette.

| Shade | Value     |     | Shade | Value     |
| ----- | --------- | --- | ----- | --------- |
| `50`  | `#f7f4ee` |     | `600` | `#5e564b` |
| `100` | `#efe9df` |     | `700` | `#3d3832` |
| `200` | `#e3dcd0` |     | `800` | `#282623` |
| `300` | `#cfc7b9` |     | `900` | `#1c1a18` |
| `400` | `#a39b8e` |     | `950` | `#121110` |
| `500` | `#7d7468` |     |       |           |

## Color — surface and text roles

| Token                  | Utilities                               | Light     | Dark      | Usage                                         |
| ---------------------- | --------------------------------------- | --------- | --------- | --------------------------------------------- |
| `--color-surface-0`    | `bg-surface-0`                          | `#f7f4ee` | `#141312` | Page background                               |
| `--color-surface-1`    | `bg-surface-1`                          | `#fdfbf7` | `#1c1a18` | Cards, panels, modals                         |
| `--color-surface-2`    | `bg-surface-2`                          | `#f1ece3` | `#262421` | Raised: inputs, hover, active row, tab track  |
| `--color-surface-3`    | `bg-surface-3`                          | `#e7e0d4` | `#302d29` | Pressed, selected, neutral chips              |
| `--color-fg`           | `text-fg`                               | `#1f1b16` | `#efe9de` | Primary text                                  |
| `--color-fg-secondary` | `text-fg-secondary`                     | `#5e554a` | `#b0a99d` | Secondary text, inactive tabs                 |
| `--color-fg-muted`     | `text-fg-muted`                         | `#6c6357` | `#948d82` | Meta, captions, icons (AA on surfaces 0 to 2) |
| `--color-line`         | `border-line` `divide-line` `ring-line` | fg at 11% | fg at 9%  | Hairlines                                     |
| `--color-line-strong`  | `border-line-strong`                    | fg at 20% | fg at 16% | Control borders, dashed drop zones            |

## Color — action and state roles

| Token                                      | Light                 | Dark                  | Usage                                                                 |
| ------------------------------------------ | --------------------- | --------------------- | --------------------------------------------------------------------- |
| `--color-primary` / `-hover`               | `#1f1b16` / `#3a332a` | `#efe9de` / `#ffffff` | Ink: the one primary action per screen                                |
| `--color-on-primary`                       | `#fdfbf7`             | `#161513`             | Text and icons on primary                                             |
| `--color-accent`                           | `#7d5e24`             | `#d6ae62`             | Brass: selection, active state, links. AA as text on surfaces 0 and 1 |
| `--color-accent-soft`                      | brass at 14%          | brass at 16%          | Selected background, text selection                                   |
| `--color-focus`                            | `#a4782a`             | `#d6ae62`             | Keyboard focus ring (3:1 per WCAG 2.2 SC 1.4.11)                      |
| `--color-success` / `-soft` / `on-success` | `#2f7d4f`             | `#4cc38a`             | Valid, owned, positive change                                         |
| `--color-danger` / `-soft` / `on-danger`   | `#b91c1c`             | `#f06a6a`             | Errors, banned, destructive confirmation                              |
| `--color-warning` / `-soft` / `on-warning` | `#92580a`             | `#e0a43a`             | Editing, unsaved, missing cards, commander tags                       |

Blue, red, green, yellow and purple already mean mana, so the chrome never uses them as
brand colour. Status colours always travel with a label or an icon.

### Buttons

`.primary-button` (ink), `.secondary-button` (surface + hairline), `.ghost-button` (text
only), `.danger-button` and `.success-button` in [`buttons.css`](../src/style/buttons.css).
Hover is a colour step and press a small scale; no lift, glow or coloured shadow.

## Typography

| Token          | Utility      | Value                                        | Usage                                                                                            |
| -------------- | ------------ | -------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `--font-sans`  | `font-sans`  | `Inter, ui-sans-serif, system-ui, …`         | Body & UI (applied to `body`)                                                                    |
| `--font-serif` | `font-serif` | `Playfair Display, ui-serif, Georgia, serif` | Display titles — brand wordmark (`.app-title`), modal titles (`.modal-title`), page/panel titles |

> The namespace is `--font-*` (Tailwind v4), **not** `--font-family-*` (v3). Using the
> old key left `font-serif` silently falling back to Georgia.

### Type scale

Semantic size rungs on the Tailwind v4 `--text-*` namespace, each carrying a paired
line-height and letter-spacing. They **add to** (never replace) the built-in
`text-xs…text-9xl` scale.

| Token            | Utility        | Size        | Leading | Tracking  | Usage                       |
| ---------------- | -------------- | ----------- | ------- | --------- | --------------------------- |
| `--text-display` | `text-display` | `1.875rem`  | `1.15`  | `-0.02em` | Hero/section display titles |
| `--text-heading` | `text-heading` | `1.25rem`   | `1.3`   | `-0.01em` | Modal/panel titles          |
| `--text-body`    | `text-body`    | `0.9375rem` | `1.6`   | —         | Long-form body copy         |
| `--text-caption` | `text-caption` | `0.75rem`   | `1.4`   | `0.02em`  | Meta, labels, captions      |

> Pair updating numbers (counters, prices, stats) with the `tabular-nums` utility so
> digits don't jitter as values change.

## Radius

| Token           | Utility        | Value      |
| --------------- | -------------- | ---------- |
| `--radius-sm`   | `rounded-sm`   | `0.25rem`  |
| `--radius-md`   | `rounded-md`   | `0.375rem` |
| `--radius-lg`   | `rounded-lg`   | `0.5rem`   |
| `--radius-xl`   | `rounded-xl`   | `0.75rem`  |
| `--radius-2xl`  | `rounded-2xl`  | `1rem`     |
| `--radius-3xl`  | `rounded-3xl`  | `1.5rem`   |
| `--radius-full` | `rounded-full` | `9999px`   |

## Elevation / Shadow

Layered elevations: each rung stacks a tight contact shadow with a softer ambient spread,
tinted with graphite-950 (`18 17 16`). Dark mode leans on surface steps and hairlines;
shadows there are for things that float. These override Tailwind's built-in `shadow-*`.

| Token           | Utility       | Intent                            |
| --------------- | ------------- | --------------------------------- |
| `--shadow-xs`   | `shadow-xs`   | Hairline lift (chips, inputs)     |
| `--shadow-sm`   | `shadow-sm`   | Resting cards, list items         |
| `--shadow-base` | `shadow-base` | Default surface elevation         |
| `--shadow-md`   | `shadow-md`   | Buttons, raised cards, hover lift |
| `--shadow-lg`   | `shadow-lg`   | Popovers, dropdowns               |
| `--shadow-xl`   | `shadow-xl`   | Floating panels, sidebars         |
| `--shadow-2xl`  | `shadow-2xl`  | Modals, full-screen overlays      |

## Glass (overlays only)

A translucent fill over a `backdrop-blur`, with a hairline border, for things that float
over content: the command palette, the profile menu and dropdowns. Modals and panels are
solid `surface-1`. The `.surface-glass` helper class (in
[`layout.css`](../src/style/layout.css)) bundles the four tokens.

| Token                  | Value                     | Usage                        |
| ---------------------- | ------------------------- | ---------------------------- |
| `--glass-blur`         | `16px`                    | Backdrop blur radius         |
| `--glass-fill-light`   | `rgb(253 251 247 / 0.86)` | Panel fill, light theme      |
| `--glass-fill-dark`    | `rgb(28 26 24 / 0.88)`    | Panel fill, dark theme       |
| `--glass-border-light` | `rgb(31 27 22 / 0.1)`     | Hairline border, light theme |
| `--glass-border-dark`  | `rgb(239 233 222 / 0.09)` | Hairline border, dark theme  |

## Spacing

8px-based scale. Named `--space-*` (not `--spacing-*`, which would override Tailwind's
built-in size scale and break `max-w-sm`/`max-w-lg`).

| Token        | Value     |     | Token         | Value    |
| ------------ | --------- | --- | ------------- | -------- |
| `--space-xs` | `0.25rem` |     | `--space-lg`  | `1.5rem` |
| `--space-sm` | `0.5rem`  |     | `--space-xl`  | `2rem`   |
| `--space-md` | `1rem`    |     | `--space-2xl` | `3rem`   |

## Transitions

| Token               | Value                                |
| ------------------- | ------------------------------------ |
| `--transition-fast` | `150ms cubic-bezier(0.4, 0, 0.2, 1)` |
| `--transition-base` | `300ms cubic-bezier(0.4, 0, 0.2, 1)` |
| `--transition-slow` | `500ms cubic-bezier(0.4, 0, 0.2, 1)` |

## Data visualization (charts)

Recharts-based panels (`src/components/stats/*Panel.tsx`) share one visual system,
defined in [`src/components/stats/chartTheme.ts`](../src/components/stats/chartTheme.ts)
and [`ChartPrimitives.tsx`](../src/components/stats/ChartPrimitives.tsx). Colors are
runtime CSS custom properties (`--chart-*`, defined in `variables.css` under `:root`
and `html.dark`, **not** inside `@theme`) referenced as `var(--chart-*)` strings —
SVG `fill`/`stroke` presentation attributes resolve custom properties live, so every
chart re-themes with the dark-mode toggle automatically, no JS branching needed.
Palette derived from the dataviz skill's reference instance; run
`validate_palette.js` again before changing any hue.

| Token group                                         | Purpose                                                                                                                                                    |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--chart-surface` / `--chart-grid` / `--chart-axis` | Chart chrome (frame bg, gridlines, axis line)                                                                                                              |
| `--chart-text-primary` / `-secondary` / `-muted`    | Tick labels, tooltip/legend ink                                                                                                                            |
| `--chart-series-1..8`                               | Fixed-order categorical palette — assign by entity identity, never by rank (e.g. card type in `TypesBreakdownPanel`)                                       |
| `--chart-sequential-1..4`                           | Single-hue blue ramp, low→high magnitude — ordinal ranks (`RarityPanel`) or plain magnitude (`ManaCurvePanel`, `ConsistencyPanel`, `BudgetEstimatorPanel`) |
| `--chart-status-good/-warning/-serious/-critical`   | Reserved status meaning (e.g. "keepable hand" in `ConsistencyPanel`, "lands available" in `ManaPipAnalysisPanel`) — never reused as a generic series       |
| `--chart-mana-w/-u/-b/-r/-g/-c`                     | Fixed MTG mana-color identity, always paired with the mana-symbol icon (`parseTextWithSymbols`) so identity never rests on hue alone                       |

**Mana-color mapping** (`MANA_CHART_COLOR` in `chartTheme.ts`): W→yellow slot,
U→blue slot, R→red slot, G→green slot (all reused from the categorical set), B→a
dedicated violet **not shared with the light-mode value** — the palette's stock dark
violet (`#9085e9`) sits at ΔE 2.5 from dark-mode blue under protanopia simulation
(below the CVD floor), which matters here because W/U/B/R/G are always adjacent in
Magic's canonical color-wheel order; `#7c3aed` clears ΔE 23.6 and is used instead for
`--chart-mana-b` in `html.dark` only. C (colorless) uses the plain muted-gray token,
outside the hue set entirely.

Shared chrome primitives (`ChartFrame`, `ChartTooltip`, `ChartLegend`,
`ChartSkeleton`, `useChartReady`) give every panel the same radius (`rounded-xl`),
border/surface treatment, tabular-numeral tooltip typography, and a loading skeleton
for the one real async boundary Recharts has (`ResponsiveContainer`'s first
measured-layout frame) — deck statistics themselves are computed synchronously, so
this is not a data-fetch spinner.

## Z-index

Named stacking layers — always reference a token, never a raw number.

| Token                         | Value   | Layer                                                                                                                                                            |
| ----------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--z-base`                    | `0`     | Normal document flow                                                                                                                                             |
| `--z-raised`                  | `10`    | Card hover lifts, active list items                                                                                                                              |
| `--z-sticky` / `--z-backdrop` | `100`   | Sticky header / click-outside backdrop                                                                                                                           |
| `--z-dropdown`                | `110`   | Dropdowns, tooltips, context menus                                                                                                                               |
| `--z-modal`                   | `200`   | Profile menu, side panels                                                                                                                                        |
| `--z-overlay`                 | `250`   | Modal overlays (dim background)                                                                                                                                  |
| `--z-dialog`                  | `300`   | Alert/confirm dialogs                                                                                                                                            |
| `--z-toast`                   | `400`   | Toast notifications                                                                                                                                              |
| `--z-header`                  | `150`   | Sticky app header — above page content and dropdowns, but **below** `--z-overlay` so modal backdrops dim it. Its own dropdowns stack inside the header's context |
| `--z-preview`                 | `9999`  | Floating card preview                                                                                                                                            |
| `--z-playtest`                | `99999` | Fullscreen playtest overlay (own stacking context)                                                                                                               |
| `--z-playtest-dialog`         | `3000`  | Prompts / pile explorer inside playtest                                                                                                                          |
| `--z-playtest-menu`           | `3100`  | Context menus inside playtest                                                                                                                                    |
