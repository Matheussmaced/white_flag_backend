import { afterEach, describe, expect, it, vi } from 'vitest';

const STRONG_SECRET = 'k9Qz3vXw7LmP2sTn8RbY5cHf1JdG6aUe0NoVtMiZ';

const loadEnv = async (overrides: Record<string, string>) => {
  vi.resetModules();
  vi.unstubAllEnvs();

  const base: Record<string, string> = {
    NODE_ENV: 'production',
    CORS_ORIGIN: 'https://app.example.com',
    JWT_ACCESS_SECRET: STRONG_SECRET,
    DATABASE_URL: 'mysql://u:p@localhost:3306/db',
    DOCS_ENABLED: 'false',
    DOCS_PASSWORD: '',
  };

  for (const [key, value] of Object.entries({ ...base, ...overrides })) vi.stubEnv(key, value);

  return import('../../src/config/env.js');
};

describe('production environment validation', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('accepts a safe production configuration', async () => {
    const { env } = await loadEnv({});

    expect(env.NODE_ENV).toBe('production');
  });

  it('rejects a wildcard CORS origin', async () => {
    await expect(loadEnv({ CORS_ORIGIN: '*' })).rejects.toThrow('CORS_ORIGIN');
  });

  it.each([
    'change-me-with-at-least-32-random-characters',
    'coloque-aqui-qualquer-texto-com-mais-de-32-caracteres',
  ])('rejects the placeholder secret %s', async (secret) => {
    await expect(loadEnv({ JWT_ACCESS_SECRET: secret })).rejects.toThrow('JWT_ACCESS_SECRET');
  });

  it('requires a strong docs password when the docs are enabled', async () => {
    await expect(loadEnv({ DOCS_ENABLED: 'true', DOCS_PASSWORD: 'curta' })).rejects.toThrow(
      'DOCS_PASSWORD',
    );
  });

  it('accepts enabled docs with a strong password', async () => {
    const { env } = await loadEnv({
      DOCS_ENABLED: 'true',
      DOCS_PASSWORD: 'uma-senha-bem-longa-123',
    });

    expect(env.DOCS_ENABLED).toBe(true);
  });

  it('does not enforce production rules in development', async () => {
    const { env } = await loadEnv({
      NODE_ENV: 'development',
      CORS_ORIGIN: '*',
      JWT_ACCESS_SECRET: 'coloque-aqui-qualquer-texto-com-mais-de-32-caracteres',
    });

    expect(env.NODE_ENV).toBe('development');
  });
});
