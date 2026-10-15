import { createHmac } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../../src/app.js';

const base64Url = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');

const signHs256 = (
  payload: object,
  secret: string,
  header: object = { alg: 'HS256', typ: 'JWT' },
) => {
  const unsigned = `${base64Url(header)}.${base64Url(payload)}`;
  const signature = createHmac('sha256', secret).update(unsigned).digest('base64url');

  return `${unsigned}.${signature}`;
};

const SECRET = 'test-secret-with-at-least-32-characters';
const futureExp = () => Math.floor(Date.now() / 1000) + 600;
const basic = (user: string, password: string) =>
  `Basic ${Buffer.from(`${user}:${password}`).toString('base64')}`;

describe('API protections', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('access token validation', () => {
    const getMe = (token: string) =>
      app.inject({ method: 'GET', url: '/couple', headers: { authorization: `Bearer ${token}` } });

    it('rejects a token signed with another secret', async () => {
      const token = signHs256(
        { sub: 'u1', iss: 'white-flag-api', exp: futureExp() },
        'another-secret-another-secret-123',
      );

      expect((await getMe(token)).statusCode).toBe(401);
    });

    it('rejects a token with alg none', async () => {
      const token = `${base64Url({ alg: 'none', typ: 'JWT' })}.${base64Url({ sub: 'u1', iss: 'white-flag-api', exp: futureExp() })}.`;

      expect((await getMe(token)).statusCode).toBe(401);
    });

    it('rejects an expired token', async () => {
      const token = signHs256(
        { sub: 'u1', iss: 'white-flag-api', exp: Math.floor(Date.now() / 1000) - 10 },
        SECRET,
      );

      expect((await getMe(token)).statusCode).toBe(401);
    });

    it('rejects a token from another issuer', async () => {
      const token = signHs256({ sub: 'u1', iss: 'someone-else', exp: futureExp() }, SECRET);

      expect((await getMe(token)).statusCode).toBe(401);
    });

    it('rejects a token signed with a different algorithm', async () => {
      const unsigned = `${base64Url({ alg: 'HS512', typ: 'JWT' })}.${base64Url({ sub: 'u1', iss: 'white-flag-api', exp: futureExp() })}`;
      const signature = createHmac('sha512', SECRET).update(unsigned).digest('base64url');

      expect((await getMe(`${unsigned}.${signature}`)).statusCode).toBe(401);
    });
  });

  describe('documentation access', () => {
    it('blocks the docs without credentials', async () => {
      const response = await app.inject({ method: 'GET', url: '/docs/json' });

      expect(response.statusCode).toBe(401);
      expect(response.headers['www-authenticate']).toContain('Basic');
    });

    it('blocks the docs with wrong credentials', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/docs/json',
        headers: { authorization: basic('docs', 'wrong-password') },
      });

      expect(response.statusCode).toBe(401);
    });

    it('serves the docs with the right credentials', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/docs/json',
        headers: { authorization: basic('docs', 'test-docs-password') },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toHaveProperty('paths');
    });

    it('blocks the client after repeated invalid attempts, even with the right password', async () => {
      const blockedApp = await buildApp();
      const attempt = (password: string) =>
        blockedApp.inject({
          method: 'GET',
          url: '/docs/json',
          headers: { authorization: basic('docs', password) },
        });

      for (let index = 0; index < 10; index++) await attempt(`wrong-${index}`);

      expect((await attempt('test-docs-password')).statusCode).toBe(429);

      await blockedApp.close();
    });
  });

  describe('auth throttling', () => {
    it('limits forgot-password requests per e-mail before touching the database', async () => {
      const send = () =>
        app.inject({
          method: 'POST',
          url: '/auth/forgot-password',
          payload: { email: 'flooded@example.com' },
        });

      const statuses: number[] = [];

      for (let index = 0; index < 4; index++) {
        const response = await send();

        statuses.push(response.statusCode);
      }

      expect(statuses[3]).toBe(429);
    }, 60_000);
  });
});
