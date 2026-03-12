import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  resolve: {
    alias: {
      '@shared': new URL('../shared/src', import.meta.url).pathname,
      '@frontend': new URL('./src', import.meta.url).pathname,
    },
  },
});
