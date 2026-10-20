import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: {
        name: 'Pocket Split',
        short_name: 'Pocket Split',
        description: 'Track shared gathering expenses and settle up.',
        theme_color: '#4f46e5',
        background_color: '#f5f7ff',
        display: 'standalone',
        start_url: '/pocket-split/',
        scope: '/pocket-split/',
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  base: '/pocket-split/',
})
