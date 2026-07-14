import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { join } from 'path';

const srcRoot = join(__dirname, 'src');

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true
      },
      manifest: {
        name: 'MTG Deck Forge',
        short_name: 'Deck Forge',
        description: 'Magic: The Gathering card search and deck builder',
        theme_color: '#0f172a',
        icons: [
          {
            src: '/icon.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
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
