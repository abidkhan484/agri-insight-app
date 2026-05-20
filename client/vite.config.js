import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons.svg'],
      manifest: {
        name: 'Agriculture Assistant',
        short_name: 'Agri Assistant',
        description: 'Unified Agricultural Assistant with Disease Detection, Record Tracker, Knowledge Base and Farmer Map.',
        theme_color: '#2e7d32',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'favicon.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: 'favicon.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,json,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/my\.plantnet\.org\/.*/i,
            handler: 'NetworkFirst',
            options: { cacheName: 'plantnet-cache', expiration: { maxAgeSeconds: 3600 } },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@modules': path.resolve(__dirname, './src/modules'),
      '@utils': path.resolve(__dirname, './src/utils'),
    },
  },
  envDir: '../',
  test: {
    globals: true,
    environment: 'jsdom',
  },
});
