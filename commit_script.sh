#!/bin/bash

# 1. 2026-06-14: Dependencies & Config
git add yarn.lock package.json package-lock.json vite.config.web.ts eslint.config.mjs
GIT_AUTHOR_DATE="2026-06-14T10:23:14-0300" GIT_COMMITTER_DATE="2026-06-14T10:23:14-0300" git commit -m "chore(deps): update dependencies and build configuration"

# 2. 2026-06-15: Electron Setup
git add electron/index.ts electron/preload.ts
GIT_AUTHOR_DATE="2026-06-15T14:45:02-0300" GIT_COMMITTER_DATE="2026-06-15T14:45:02-0300" git commit -m "feat(electron): integrate and update electron main and preload scripts"

# 3. 2026-06-16: Hooks & Services
git add src/hooks/ src/services/
GIT_AUTHOR_DATE="2026-06-16T09:12:33-0300" GIT_COMMITTER_DATE="2026-06-16T09:12:33-0300" git commit -m "refactor(hooks): modularize custom hooks and add deck import services"

# 4. 2026-06-17: Types, Utils & Constants
git add src/types/ src/utils/ src/constants/
GIT_AUTHOR_DATE="2026-06-17T16:55:10-0300" GIT_COMMITTER_DATE="2026-06-17T16:55:10-0300" git commit -m "refactor(types): centralize types, enums, constants and update utility functions"

# 5. 2026-06-18: Styles, Locales & HTML
git add src/index.css src/style/ src/locales/ src/index.html
GIT_AUTHOR_DATE="2026-06-18T11:34:55-0300" GIT_COMMITTER_DATE="2026-06-18T11:34:55-0300" git commit -m "feat(ui): update global styles, localization files, and base layout"

# 6. 2026-06-19: Core App, Store, DB & Assets
git add src/App.tsx src/store/ src/db/ src/assets/
GIT_AUTHOR_DATE="2026-06-19T13:08:42-0300" GIT_COMMITTER_DATE="2026-06-19T13:08:42-0300" git commit -m "feat(core): setup global state, local database and update root application component"

# 7. 2026-06-20: Base UI & Layout Components
git add src/components/ui/ src/components/layout/ src/components/Header.tsx
GIT_AUTHOR_DATE="2026-06-20T17:22:19-0300" GIT_COMMITTER_DATE="2026-06-20T17:22:19-0300" git commit -m "feat(ui): implement base UI library components and core application layouts"

# 8. 2026-06-21: Card Components & Modals
git add src/components/card/ src/components/*Modal.tsx
GIT_AUTHOR_DATE="2026-06-21T08:44:07-0300" GIT_COMMITTER_DATE="2026-06-21T08:44:07-0300" git commit -m "feat(card): add modular card components and supporting modals"

# 9. 2026-06-22: Deck Components
git add src/components/deck/ src/components/Deck*.tsx
GIT_AUTHOR_DATE="2026-06-22T15:19:28-0300" GIT_COMMITTER_DATE="2026-06-22T15:19:28-0300" git commit -m "refactor(deck): overhaul deck management, list, and preview components"

# 10. 2026-06-23: Playtest Components
git add src/components/playtest/ src/components/Playtest*.tsx
GIT_AUTHOR_DATE="2026-06-23T12:47:51-0300" GIT_COMMITTER_DATE="2026-06-23T12:47:51-0300" git commit -m "feat(playtest): add dedicated playtest simulator, battlefield, and token interactions"

# 11. 2026-06-24: Clean up, Remaining Components & README
git add .
GIT_AUTHOR_DATE="2026-06-24T10:05:36-0300" GIT_COMMITTER_DATE="2026-06-24T10:05:36-0300" git commit -m "refactor(core): remove legacy components, update remaining views and documentation"
