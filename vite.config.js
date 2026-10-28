import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' so the build runs from any sub-folder (GitHub Pages)
export default defineConfig({
  base: './',
  plugins: [react()],
  build: { chunkSizeWarningLimit: 700 },
})
