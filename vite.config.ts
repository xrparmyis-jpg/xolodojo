import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const defaultSiteOrigin =
    mode === 'production' ? 'https://xolodojo.vercel.app' : 'http://localhost:5173'
  const siteOrigin = (env.VITE_SITE_URL || env.VITE_APP_URL || defaultSiteOrigin)
    .trim()
    .replace(/\/$/, '')
  const ogImagePath = env.VITE_OG_IMAGE_PATH || '/team/Cryptonite.jpg'
  const ogImageUrl = `${siteOrigin}${ogImagePath.startsWith('/') ? '' : '/'}${ogImagePath}`

  return {
  plugins: [
    react(),
    {
      name: 'inject-og-meta-urls',
      transformIndexHtml(html) {
        return html
          .replaceAll('__OG_SITE_ORIGIN__', siteOrigin)
          .replaceAll('__OG_IMAGE_URL__', ogImageUrl)
      },
    },
  ],
  /** Pre-bundle CJS `tz-lookup` so dev doesn’t hit stale `.vite/deps` 504 after installs. */
  optimizeDeps: {
    include: ['tz-lookup'],
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  publicDir: 'public',
  }
})
