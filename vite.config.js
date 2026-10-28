import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' so the build runs from any sub-folder (GitHub Pages)
// three.js lives in its own lazy chunk (~540 kB raw, ~135 kB gzip), so the limit sits just above it.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: { chunkSizeWarningLimit: 600 },
})
