import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    watch: {
      usePolling: true
    }
  },
  optimizeDeps: {
    include: ['date-fns', 'date-fns/locale', 'recharts']
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
    pool: 'vmForks',
    vmForks: {
      singleFork: true,
    },
    testTimeout: 60000,
    hookTimeout: 60000,
  }
});
