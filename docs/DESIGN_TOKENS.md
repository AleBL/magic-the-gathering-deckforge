# Design Tokens

Single source of truth for the visual system. All tokens live in the Tailwind v4
`@theme` block at [`src/style/variables.css`](../src/style/variables.css), so each
one automatically generates the matching utility class (`bg-primary`, `text-danger`,
`font-serif`, `shadow-md`, `rounded-xl`, …). **Always reference a token, never a raw
shade** (`bg-blue-600` → `bg-primary`).

Dark mode uses the class strategy (`html.dark`, see
[`useDarkMode`](../src/hooks/useDarkMode.ts)). Semantic color tokens are
theme-agnostic single values that read well on both surfaces; per-component dark
adaptation is done with Tailwind `dark:` variants next to the token.

---

## Color — semantic

Each token maps to a Tailwind palette shade. `-hover` variants are the interaction
state for the base token.

| Token | Utilities | Value | Usage |
|-------|-----------|-------|-------|
| `--color-primary` | `bg-primary` `text-primary` `border-primary` `ring-primary` | `blue-600` | Primary actions, active tabs/pills, links, brand accent |
| `--color-primary-hover` | `hover:bg-primary-hover` | `blue-700` | Hover state of primary buttons |
| `--color-secondary` | `bg-secondary` … | `gray-500` | Secondary/neutral actions |
| `--color-secondary-hover` | `hover:bg-secondary-hover` | `gray-600` | Hover state of secondary |
| `--color-success` | `bg-success` `text-success` | `green-600` | Confirmations, valid state, positive stats |
| `--color-success-hover` | `hover:bg-success-hover` | `green-700` | Hover state of success |
| `--color-danger` | `bg-danger` `text-danger` | `red-600` | Destructive actions, errors, banned/invalid |
| `--color-danger-hover` | `hover:bg-danger-hover` | `red-700` | Hover state of danger |
| `--color-warning` | `bg-warning` `text-warning` | `amber-600` | Warnings, editing/unsaved badges, commander tags |
| `--color-warning-hover` | `hover:bg-warning-hover` | `amber-700` | Hover state of warning |

> Neutral grays (`gray-*`, `slate-*`) for text, borders, and surfaces are **not**
> tokenized — they carry per-component light/dark pairs (`text-gray-700 dark:text-gray-300`)
> and are intentionally left as raw utilities.

## Typography

| Token | Utility | Value | Usage |
|-------|---------|-------|-------|
| `--font-sans` | `font-sans` | `Inter, ui-sans-serif, system-ui, …` | Body & UI (applied to `body`) |
| `--font-serif` | `font-serif` | `Playfair Display, ui-serif, Georgia, serif` | Display titles — brand wordmark (`.app-title`), modal titles (`.modal-title`), page/panel titles |

> The namespace is `--font-*` (Tailwind v4), **not** `--font-family-*` (v3). Using the
> old key left `font-serif` silently falling back to Georgia.

## Radius

| Token | Utility | Value |
|-------|---------|-------|
| `--radius-sm` | `rounded-sm` | `0.25rem` |
| `--radius-md` | `rounded-md` | `0.375rem` |
| `--radius-lg` | `rounded-lg` | `0.5rem` |
| `--radius-xl` | `rounded-xl` | `0.75rem` |
| `--radius-2xl` | `rounded-2xl` | `1rem` |
| `--radius-3xl` | `rounded-3xl` | `1.5rem` |
| `--radius-full` | `rounded-full` | `9999px` |

## Elevation / Shadow

Premium layered elevations — each rung stacks a tight contact shadow with a softer
ambient spread, tinted with `slate-950` (`15 23 42`) instead of pure black for a
cooler, less muddy feel. These override Tailwind's built-in `shadow-*`.

| Token | Utility | Intent |
|-------|---------|--------|
| `--shadow-xs` | `shadow-xs` | Hairline lift (chips, inputs) |
| `--shadow-sm` | `shadow-sm` | Resting cards, list items |
| `--shadow-base` | `shadow-base` | Default surface elevation |
| `--shadow-md` | `shadow-md` | Buttons, raised cards, hover lift |
| `--shadow-lg` | `shadow-lg` | Popovers, dropdowns |
| `--shadow-xl` | `shadow-xl` | Floating panels, sidebars |
| `--shadow-2xl` | `shadow-2xl` | Modals, full-screen overlays |

## Spacing

8px-based scale. Named `--space-*` (not `--spacing-*`, which would override Tailwind's
built-in size scale and break `max-w-sm`/`max-w-lg`).

| Token | Value | | Token | Value |
|-------|-------|-|-------|-------|
| `--space-xs` | `0.25rem` | | `--space-lg` | `1.5rem` |
| `--space-sm` | `0.5rem` | | `--space-xl` | `2rem` |
| `--space-md` | `1rem` | | `--space-2xl` | `3rem` |

## Transitions

| Token | Value |
|-------|-------|
| `--transition-fast` | `150ms cubic-bezier(0.4, 0, 0.2, 1)` |
| `--transition-base` | `300ms cubic-bezier(0.4, 0, 0.2, 1)` |
| `--transition-slow` | `500ms cubic-bezier(0.4, 0, 0.2, 1)` |

## Z-index

Named stacking layers — always reference a token, never a raw number.

| Token | Value | Layer |
|-------|-------|-------|
| `--z-base` | `0` | Normal document flow |
| `--z-raised` | `10` | Card hover lifts, active list items |
| `--z-sticky` / `--z-backdrop` | `100` | Sticky header / click-outside backdrop |
| `--z-dropdown` | `110` | Dropdowns, tooltips, context menus |
| `--z-modal` | `200` | Profile menu, side panels |
| `--z-overlay` | `250` | Modal overlays (dim background) |
| `--z-dialog` | `300` | Alert/confirm dialogs |
| `--z-toast` | `400` | Toast notifications |
| `--z-header` | `2000` | Sticky app header |
| `--z-preview` | `9999` | Floating card preview |
| `--z-playtest` | `99999` | Fullscreen playtest overlay (own stacking context) |
| `--z-playtest-dialog` | `3000` | Prompts / pile explorer inside playtest |
| `--z-playtest-menu` | `3100` | Context menus inside playtest |
