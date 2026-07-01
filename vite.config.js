import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/Meditation-by-khoun/' : '/',
  server: {
    port: 3000,
    open: true
  }
});
