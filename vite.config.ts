import { defineConfig } from 'vitest/config';

// O front-end é servido pelo Vite; chamadas a /api são encaminhadas ao servidor Node local.
export default defineConfig({
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:3001',
    },
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
