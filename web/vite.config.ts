import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 18082,
    proxy: {
      '/api': {
        target: 'http://localhost:18080',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, '')
      },
      '/camunda-api': {
        target: 'http://localhost:18081',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/camunda-api/, '')
      }
    }
  }
});
