<div align="center">
<h1>Magic: The Gathering Search</h1>

Search Magic: The Gathering cards, build and manage decks with [Scryfall](https://scryfall.com/) API integration. Built with **TypeScript**, **React 19**, **Electron**, **Vite 6**, and **Tailwind CSS v4**.
</div>

## Features

- **Card Search** — Advanced filtering by name, colors, types, rarity, and converted mana cost (CMC) using debounced Scryfall search.
- **Deck Builder** — Add, remove, edit, and organize cards in a dedicated workspace deck.
- **Deck Manager** — Save, load, edit, import, and export decks locally via `localStorage` or JSON files (MTG Arena and `.DEC` file exports included).
- **Double-Faced / Transforming Cards** — Flip cards dynamically in the card details modal to see their reverse side with interactive visual rotations and re-calculated attributes (image, P/T, text).
- **Dynamic Scryfall API Legality Check** — Real-time validation for Standard, Modern, Vintage, Pauper, and Commander querying the Scryfall API directly, with custom Vintage restricted 1-copy limit checks.
- **Interactive Playtest Simulator** — Realistic playground playmat workspace supporting card drawing, life total tracker, graveyard rescue, and drag-less battlefield positioning (Combat Zone, Support Zone, Spells, and Resource Lands).
- **Active Deck Statistics & Mana Curve** — High-fidelity visual breakdown of your deck's mana curve chart, average CMC (excluding lands), color distribution, and card types division.
- **Fully Localized Commander Checks** — 100% internationalized validation rules (Commander validation, "Partner", "Friends Forever", "Doctor's Companion", and "Choose a Background") in English, Spanish, and Portuguese.
- **Dark Mode** — Modern dark-mode toggle with automatic local storage persistence.
- **Cross-Platform** — Runs as a native desktop shell (Electron) or in a fast browser sandbox.

## Built With

* [![React][React]][React-url]
* [![Vite][Vite.js]][Vite-url]
* [![TypeScript][TypeScript]][TypeScript-url]
* [![Electron][Electron.js]][Electron-url]
* [![TailwindCSS][TailwindCSS]][TailwindCSS-url]
* [![ESLint][ESLint]][ESLint-url]

<!-- MARKDOWN LINKS & IMAGES -->
[React]: https://img.shields.io/badge/react-%2320232a.svg\?style\=for-the-badge\&logo\=react\&logoColor\=%2361DAFB
[React-url]: https://react.dev/
[Vite.js]: https://img.shields.io/badge/vite-%23646CFF.svg\?style\=for-the-badge\&logo\=vite\&logoColor\=white
[Vite-url]: https://vitejs.dev
[TypeScript]: https://img.shields.io/badge/typescript-%23007ACC.svg\?style\=for-the-badge\&logo\=typescript\&logoColor\=white
[TypeScript-url]: https://www.typescriptlang.org/
[Electron.js]: https://img.shields.io/badge/Electron-191970\?style\=for-the-badge\&logo\=Electron\&logoColor\=white
[Electron-url]: https://www.electronjs.org/
[TailwindCSS]: https://img.shields.io/badge/tailwindcss-%2338B2AC.svg\?style\=for-the-badge\&logo\=tailwind-css\&logoColor\=white
[TailwindCSS-url]: https://tailwindcss.com/
[ESLint]: https://img.shields.io/badge/ESLint-4B3263\?style\=for-the-badge\&logo\=eslint\&logoColor\=white
[ESLint-url]: https://eslint.org/

## Getting Started

***Installed versions:***

```bash
node -v # 24.15.0
yarn -v # 1.22.19
npm  -v # 11.12.1
```

### Linux dependencies (Electron)

```bash
sudo apt-get install -yq --no-install-recommends libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 libnss3 libgbm-dev

### Install dependencies

```bash
npm install
# OR
yarn install
```

### Develop

```bash
# Electron app with hot reload
npm run dev

# Browser only (no Electron)
bash dev-web.sh
```

### Build

```bash
npm run build          # default build
npm run build:win      # Windows target
npm run build:mac      # macOS target
npm run build:linux    # Linux target
```

Distributable files are generated in `dist-vite/` and `dist-electron/`.
See [Electron Builder CLI docs](https://www.electron.build/cli.html) for additional options.

### Other scripts

```bash
npm run lint           # ESLint + Prettier auto-fix
npm run type-check     # TypeScript type check only
npm run deps:update    # interactive major dependency updates (taze)
npm run clean          # remove build output folders
```

## Project Structure

```
src/
├── components/   # UI components (CardGrid, DeckManager, CardSearch, …)
├── hooks/        # Custom React hooks (useCardSearch, useDeckManager, …)
├── locales/      # i18n translations (en, es, pt)
├── services/     # File download utilities
├── style/        # Modular CSS (variables, layout, buttons, forms, …)
├── types/        # TypeScript types (Card, Deck, …)
└── utils/        # Deck validator, mana symbol helpers
electron/         # Electron main process & preload script
```

## Contributing

Contributions are welcome! To contribute:

1. Fork the project
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit using [Conventional Commits](https://www.conventionalcommits.org/) (`git commit -m 'feat: add my feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request
