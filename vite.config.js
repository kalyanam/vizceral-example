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
    host: '0.0.0.0',
    port: 8080
  },
  preview: {
    host: '0.0.0.0',
    port: 8080
  },
  build: {
    sourcemap: true,
    chunkSizeWarningLimit: 1500
  }
});
