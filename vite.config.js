import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' so the build runs from any sub-folder (GitHub Pages).
// The three.js scene is a lazy chunk on purpose, so its size doesn't block first paint.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: { chunkSizeWarningLimit: 600 },
})
