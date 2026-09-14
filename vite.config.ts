import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  build: {
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 700,
  },
  server: {
    host: '0.0.0.0',
    port: 43180,
    strictPort: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 43180,
    strictPort: true,
  },
})
