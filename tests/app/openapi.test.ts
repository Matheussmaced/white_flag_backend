import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../../src/app.js';

interface Operation {
  summary?: string;
  description?: string;
  tags?: string[];
  security?: unknown[];
  responses?: Record<string, { description?: string }>;
}

const PUBLIC_PATH_PREFIXES = ['/auth/', '/health'];
const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete'];

describe('OpenAPI documentation', () => {
  let app: FastifyInstance;
  let operations: { label: string; path: string; operation: Operation }[];

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();

    const paths = app.swagger().paths as Record<string, Record<string, Operation>>;

    operations = Object.entries(paths).flatMap(([path, methods]) =>
      Object.entries(methods)
        .filter(([method]) => HTTP_METHODS.includes(method))
        .map(([method, operation]) => ({
          label: `${method.toUpperCase()} ${path}`,
          path,
          operation,
        })),
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it('documents at least one operation', () => {
    expect(operations.length).toBeGreaterThan(0);
  });

  it('gives every operation a tag, summary and description', () => {
    const incomplete = operations
      .filter(
        ({ operation }) => !operation.tags?.length || !operation.summary || !operation.description,
      )
      .map(({ label }) => label);

    expect(incomplete).toEqual([]);
  });

  it('documents the 500 error on every operation', () => {
    const missing = operations
      .filter(({ operation }) => !operation.responses?.['500'])
      .map(({ label }) => label);

    expect(missing).toEqual([]);
  });

  it('describes every response', () => {
    const missing = operations
      .filter(({ operation }) =>
        Object.values(operation.responses ?? {}).some((response) => !response.description),
      )
      .map(({ label }) => label);

    expect(missing).toEqual([]);
  });

  it('protects every non-public operation with bearer auth and documents 401', () => {
    const unprotected = operations
      .filter(({ path }) => !PUBLIC_PATH_PREFIXES.some((prefix) => path.startsWith(prefix)))
      .filter(({ operation }) => !operation.security?.length || !operation.responses?.['401'])
      .map(({ label }) => label);

    expect(unprotected).toEqual([]);
  });
});
