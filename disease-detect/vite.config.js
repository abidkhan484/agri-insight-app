import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'ফসলের রোগ শনাক্তকরণ',
        short_name: 'রোগ শনাক্ত',
        description: 'ZBNF ফসলের রোগ চিহ্নিত করুন এবং চিকিৎসা জানুন',
        theme_color: '#386641',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' },
        ],
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
});
