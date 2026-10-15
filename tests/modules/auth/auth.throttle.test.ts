import { describe, expect, it } from 'vitest';
import { extractEmailKey } from '../../../src/modules/auth/auth.throttle.js';

describe('extractEmailKey', () => {
  it('normalizes the e-mail used as throttling key', () => {
    expect(extractEmailKey({ email: '  Jane@Example.COM ' })).toBe('jane@example.com');
  });

  it.each([[undefined], [null], ['text'], [{}], [{ email: 42 }], [{ email: '' }]])(
    'returns null for %j',
    (body) => {
      expect(extractEmailKey(body)).toBeNull();
    },
  );
});
