import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' so the build runs from any sub-folder (GitHub Pages)
export default defineConfig({
  base: './',
  plugins: [react()],
  // the 3D scene is a lazy chunk; three.js alone is most of it
  build: { chunkSizeWarningLimit: 700 },
})
