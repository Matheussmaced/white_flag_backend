import { describe, expect, it } from 'vitest';
import { parseCorsOrigins } from '../../src/config/cors.js';

describe('parseCorsOrigins', () => {
  it('allows any origin for a wildcard', () => {
    expect(parseCorsOrigins('*')).toBe(true);
  });

  it('splits a list of origins', () => {
    expect(parseCorsOrigins('https://a.com,http://localhost:8081')).toEqual([
      'https://a.com',
      'http://localhost:8081',
    ]);
  });

  it('ignores spaces and trailing slashes', () => {
    expect(parseCorsOrigins(' https://a.com/ , https://b.com// ')).toEqual([
      'https://a.com',
      'https://b.com',
    ]);
  });

  it('drops empty entries', () => {
    expect(parseCorsOrigins('https://a.com,,')).toEqual(['https://a.com']);
  });
});
