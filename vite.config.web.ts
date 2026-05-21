import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { join } from 'path';

const srcRoot = join(__dirname, 'src');

export default defineConfig({
  plugins: [react(), tailwindcss()],
  root: srcRoot,
  base: '/',
  resolve: {
    alias: {
      '/@': srcRoot
    }
  },
  server: {
    port: 3000,
    host: '0.0.0.0'
  }
});
