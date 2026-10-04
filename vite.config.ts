import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    port: 3000,
    open: false
  },
  build: {
    target: 'esnext',
    assetsInlineLimit: 4096,
    chunkSizeWarningLimit: 2000
  }
});
