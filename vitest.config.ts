import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    env: {
      NODE_ENV: 'test',
      DOCS_ENABLED: 'true',
      JWT_ACCESS_SECRET: 'test-secret-with-at-least-32-characters',
      DATABASE_URL: 'mysql://test:test@localhost:3306/test',
    },
  },
});
