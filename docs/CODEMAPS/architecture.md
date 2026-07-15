<!-- Generated: 2026-07-15 | Files scanned: 50+ | Token estimate: ~1200 -->

# MTG Deck Forge — Architecture Overview

## System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      React UI Layer                         │
│  (Components: Search, Deck, Playtest, Stats, Modals)       │
└──────────────┬──────────────────────────────────────────────┘
               │
        ┌──────┴──────┬──────────────┐
        │             │              │
   ┌────▼────┐   ┌────▼────┐   ┌────▼──────┐
   │  Zustand│   │  Hooks   │   │ Services  │
   │  Store  │   │ (Custom) │   │ (APIs)    │
   └────┬────┘   └────┬────┘   └────┬──────┘
        │             │             │
        │        ┌────┴─────────────┴──┐
        │        │                     │
   ┌────▼────────▼─┐            ┌──────▼──────┐
   │   IndexedDB   │            │  Scryfall   │
   │   (Dexie)     │            │  API        │
   │  - Decks      │            │             │
   │  - Cards      │            └─────────────┘
   └───────────────┘
```

## Core Layers

### **Presentation Layer (React Components)**
- **Card**: Search, Grid, Details Modal, Printing Selector, Double-Faced Card Flip
- **Deck**: DeckManager, DeckList, DeckPreview, DeckStats, DeckValidationBadge, EditingBanner
- **Playtest**: PlaytestSimulator, Battlefield, Hand, TokenModal, Particles, DamageTracker
- **UI**: Dialogs, Toasts, Command Palette, Shortcuts Overlay, Filters, Proxy Printer
- **Layout**: RootLayout, Header, ProfileMenu

### **State Management Layer (Zustand)**
- **useDeckStore** → Deck state (currentDeck, editingDeck, tokens, format, name, notes)
- Immutable updates: addCard, removeCard, updateCard, toggleCommander, clearDeck

### **Custom Hooks Layer**
- **Deck ops**: useDeckManager, useDeckActions, useDeckTokens, useDeckTextImport
- **Search/Cards**: useCardSearch, useCardPrints, useCardRelatedTokens
- **Playtest**: usePlaytestSimulator, useProxyPrint, useTokenHandlers
- **UI**: useShortcuts, useDialog, useToast, useDarkMode, useSearchFilters

### **Services Layer**
- **deckImportService** → Parse MTG Arena / .DEC imports, normalize card names
- **fileDownload** → JSON export, proxy print download
- **Scryfall API** (via scryfall-sdk) → Card search, legality checks, image fetching

### **Persistence Layer (Dexie/IndexedDB)**
- Deck schema: id, name, format, cards[], tokens[], notes, createdAt, updatedAt
- Card schema: scryfall_id, name, set, foil, alternative_printing_index
- Full offline support, automatic migrations

### **Utilities & Helpers**
- **deckValidator** → Commander rules, format legality, partner validation
- **symbolHelper** → Scryfall symbol rendering (mana, loyalty, icons)
- **deckStatistics** → Mana curve, color distribution, card type breakdown
- **translationHelper** → Multi-language support (en, es, pt)
- **contextMenuPosition** → Smart popup placement

## Data Flow

```
User Input
   │
   ├─→ CardSearch Hook
   │   └─→ Scryfall API (debounced)
   │       └─→ CardDetails Modal (user selects printing)
   │           └─→ useDeckStore.addCard()
   │
   ├─→ DeckManager
   │   ├─→ useDeckManager (load/save/export)
   │   │   └─→ Dexie (IndexedDB persist)
   │   └─→ useDeckValidator
   │       └─→ Legality check vs Scryfall
   │
   └─→ PlaytestSimulator
       ├─→ usePlaytestSimulator
       │   └─→ Hand draw, life total, battlefield state
       └─→ Auto-token analyzer
           └─→ useDeckTokens (populate related tokens)
```

## Integration Points

| Layer | Integration | Purpose |
|-------|-----------|---------|
| UI → Zustand | useDeckStore hooks | State mutations |
| Zustand → Dexie | useDeckManager | Save/load decks |
| UI → Scryfall | useCardSearch | Card data, legality |
| Scryfall → Card Details | fetchSymbols | Render mana symbols |
| Deck → Validator | deckValidator.ts | Enforce format rules |

## Deployment Targets

- **Electron**: Native desktop (Windows, macOS, Linux) via electron-builder
- **Web**: Browser sandbox via Vite, PWA support
- Single codebase, dual entry: `main.tsx` (web), `electron/` (native)
