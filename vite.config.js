import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: '/thennangur/',
  plugins: [
    react(),
    tailwindcss()
  ],
  server: {
    port: 3000,
    open: false,
    proxy: {
      '/api': {
        target: 'http://localhost:5055',
        changeOrigin: true,
        secure: false,
      }
    }
  }
});
