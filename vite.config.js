import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/Meditation-khoun/' : '/',
  server: {
    port: 3000,
    open: true
  }
});
