import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' so the build runs from any sub-folder (GitHub Pages).
// The three.js scene is its own lazy chunk, loaded after first paint, so its size doesn't block anything.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: { chunkSizeWarningLimit: 600 },
})
