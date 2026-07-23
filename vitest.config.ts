import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// Dedicated Vitest config: the app's vite.config.ts wires in Electron plugins and
// filesystem side effects (rmSync) at load time, which don't belong in a jsdom test
// run, so we compose a minimal React-only pipeline here instead of reusing it.
export default defineConfig({
  plugins: [react()],
  test: {
    globals: false,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    css: false,
    coverage: {
      provider: 'v8',
      // Scoped to the modules this first-pass suite actually targets, so the numbers
      // reflect tested code rather than being diluted by not-yet-covered utilities.
      include: [
        'src/utils/deckGrouping.ts',
        'src/utils/deckValidator.ts',
        'src/utils/symbolHelper.tsx',
        'src/utils/translationHelper.ts',
        'src/utils/deckDoctor.ts',
        'src/utils/deckStatistics.ts',
        'src/utils/collectionMath.ts',
        'src/utils/deckText.ts',
        'src/services/collectionCsv.ts',
        'src/services/deckShare.ts',
        'src/store/useDeckStore.ts',
        'src/hooks/usePlaytestSimulator.ts',
        'src/hooks/useInstallPrompt.ts',
        'src/hooks/useOnlineStatus.ts',
        'src/components/DeckStats.tsx',
        'src/components/card/CardItem.tsx'
      ],
      // 'json-summary' + 'json' feed the PR coverage-report action; 'text' for CI logs.
      reporter: ['text', 'text-summary', 'json', 'json-summary', 'html'],
      // Hard floor: CI fails if coverage drops below these. Tune upward as tests grow.
      thresholds: {
        statements: 60,
        branches: 45,
        functions: 60,
        lines: 62
      }
    }
  }
});
