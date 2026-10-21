import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
  server: {
    // Pinned: localMart-BE's CORS allowlist (src/config/allowOrigins.ts)
    // names this origin exactly.
    port: 5174,
    strictPort: true,
    // Through the Nginx gateway (`npm run gateway`), which sends these /api
    // paths to localMart-BE.
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
