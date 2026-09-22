import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name]-v${Date.now()}.js`,
        chunkFileNames: `assets/[name]-v${Date.now()}.js`,
        assetFileNames: `assets/[name]-v${Date.now()}[extname]`,
      },
    },
  },
  server: {
    port: 3000,
    host: true,
  },
});
