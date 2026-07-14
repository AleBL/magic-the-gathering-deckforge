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
