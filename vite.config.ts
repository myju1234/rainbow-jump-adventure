import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: null,
      includeAssets: ['favicon.png', 'icons/apple-touch-icon.png'],
      manifest: {
        name: '무지개 점프 대모험',
        short_name: '무지개점프',
        description: '통통 뛰며 깃발까지 달리는 점프 어드벤처',
        lang: 'ko',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'any',
        background_color: '#eaf7ff',
        theme_color: '#3568e8',
        categories: ['games', 'kids'],
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // 512px 아이콘은 용량이 커서 오프라인 캐시에는 넣지 않습니다. 설치할 때 브라우저가 직접 받아 갑니다.
        globPatterns: ['**/*.{js,css,html,svg,ico,woff2}'],
        globIgnores: ['**/icons/icon-*.png'],
        navigateFallback: '/index.html',
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})
