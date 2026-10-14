import { mkdirSync, writeFileSync } from 'node:fs';

process.env.NODE_ENV = 'test';
process.env.DOCS_ENABLED = 'true';
process.env.JWT_ACCESS_SECRET ??= 'openapi-export-secret-with-32-characters';
process.env.DATABASE_URL ??= 'mysql://export:export@localhost:3306/export';

const { buildApp } = await import('../src/app.js');

const app = await buildApp();

await app.ready();

mkdirSync('docs', { recursive: true });
writeFileSync('docs/openapi.json', `${JSON.stringify(app.swagger(), null, 2)}\n`);

await app.close();
