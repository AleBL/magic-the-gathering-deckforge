import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Initialize the shared i18next instance so components/hooks using useTranslation
// and helpers reading i18n resources behave the same as in the running app.
import '../plugins/i18n';

// Unmount React trees rendered by Testing Library between tests to avoid leakage.
afterEach(() => {
  cleanup();
});

// TODO(test-coverage): first-pass suite intentionally scoped to the pure logic and
// components that the upcoming refactors (V5 phases A.3, B, C) will touch. Still
// untested and worth adding as those land:
//   - utils: deckStatistics, cardTypePredicates, formatLabel, contextMenuPosition, toastHelper
//   - store/hooks: useDeckManager, useDeckActions, useDeckTextImport, useCardSearch,
//     useSearchFilters, useShortcuts, and playtest undo/redo + mulligan flows
//   - services: deckImportService, fileDownload
//   - components: SearchFilters, DeckManager, PlaytestSimulator, stats/* panels,
//     and deckValidator's commander partnership / color-identity branches
