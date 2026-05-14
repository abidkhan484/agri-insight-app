import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'ZBNF কৃষি জ্ঞানভান্ডার',
        short_name: 'ZBNF জ্ঞান',
        description: 'জিরো বাজেট প্রাকৃতিক কৃষির সম্পূর্ণ গাইড',
        theme_color: '#2d6a4f',
        background_color: '#f0f4f0',
        display: 'standalone',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,jpeg,json,woff2}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024 // 5MB for images
      }
    })
  ]
});
