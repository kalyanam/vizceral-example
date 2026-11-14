import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    __HIDE_DATA__: JSON.stringify(!!process.env.HIDE_DATA)
  },
  worker: {
    format: 'es'
  },
  server: {
    host: true,
    port: 8080
  },
  preview: {
    host: true,
    port: 8080
  },
  build: {
    sourcemap: true,
    chunkSizeWarningLimit: 1500
  }
});
