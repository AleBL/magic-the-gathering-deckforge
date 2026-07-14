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
      include: ['src/utils/**', 'src/store/**', 'src/hooks/usePlaytestSimulator.ts'],
      reporter: ['text', 'html']
    }
  }
});
