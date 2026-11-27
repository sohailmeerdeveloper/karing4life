import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Unknown addresses: vercel.json only rewrites real routes to index.html, so anything else
// falls through to dist/404.html, which Vercel serves with HTTP 404. It's a copy of the app,
// so visitors still see the branded "Page not found" page (and it's marked noindex).
const notFoundCopy = () => ({
  name: 'k4l-404-page',
  apply: 'build',
  closeBundle() {
    const dist = fileURLToPath(new URL('./dist/', import.meta.url))
    copyFileSync(dist + 'index.html', dist + '404.html')
  },
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), notFoundCopy()],
  build: {
    rollupOptions: {
      output: {
        // vendor libraries in their own long-cached files, downloaded in parallel
        manualChunks: (id) => {
          if (id.includes('node_modules/@supabase')) return 'supabase';
          if (/node_modules\/(react|react-dom|react-router|react-router-dom|scheduler)\//.test(id)) return 'react';
        },
      },
    },
  },
})
