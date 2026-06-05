import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['pwa-icon.svg'],
      manifest: {
        name: 'Palette — 지인이 보증하는 만남',
        short_name: 'Palette',
        description: '나의 색을 찾고, 너의 색과 조화를 이루다 — 지인 네트워크 기반 데이팅',
        theme_color: '#F97316',     // orange-500 — 메인 색
        background_color: '#ffffff',
        display: 'standalone',       // 브라우저 UI 숨김 (앱처럼)
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        lang: 'ko',
        categories: ['social', 'lifestyle'],
        icons: [
          // 임시 placeholder SVG — 추후 디자이너 PNG 로 교체 (192/512/maskable 3종 필요)
          {
            src: 'pwa-icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: 'pwa-icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // API 호출은 캐싱 안 함 (실시간 데이터)
        navigateFallbackDenylist: [/^\/api/, /^\/oauth2/, /^\/login/],
        // 정적 자산만 자동 캐싱 (큰 PNG 는 제외)
        globPatterns: ['**/*.{js,css,html,svg,ico,woff2}'],
        // 작은 이미지만 캐싱 (런타임 캐시는 별도)
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3MB
      },
      devOptions: {
        enabled: false,  // 개발 시엔 비활성 (캐싱 디버깅 방해 방지)
      },
    }),
  ],
  build: {
    // vendor chunk 분리 — React 등은 별도 chunk 로 (코드 변경 시 재다운 X, 영구 캐시)
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['lucide-react', 'sonner'],
        },
      },
    },
    chunkSizeWarningLimit: 700,
  },
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    // 로컬 개발 시 /api, /oauth2, /login 호출을 백엔드 (8080) 로 프록시
    // → 프론트 코드는 상대경로 그대로 사용 가능 (prod 와 동일 동작)
    proxy: {
      '/api': 'http://localhost:8080',
      '/oauth2': 'http://localhost:8080',
      '/login': 'http://localhost:8080',
    },
  },
})
