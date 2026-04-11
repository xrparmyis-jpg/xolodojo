import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  /** Pre-bundle CJS `tz-lookup` so dev doesn’t hit stale `.vite/deps` 504 after installs. */
  optimizeDeps: {
    include: ['tz-lookup'],
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  publicDir: 'public',
})
