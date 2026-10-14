import { describe, expect, it } from 'vitest';
import { isOnline } from '../../src/lib/presence.js';

const now = new Date('2026-03-14T12:00:00.000Z');

describe('isOnline', () => {
  it('is online when seen inside the window', () => {
    expect(isOnline(new Date('2026-03-14T11:59:00.000Z'), now, 120)).toBe(true);
  });

  it('is online exactly at the window limit', () => {
    expect(isOnline(new Date('2026-03-14T11:58:00.000Z'), now, 120)).toBe(true);
  });

  it('is offline after the window', () => {
    expect(isOnline(new Date('2026-03-14T11:57:59.000Z'), now, 120)).toBe(false);
  });

  it('is offline when never seen', () => {
    expect(isOnline(null, now, 120)).toBe(false);
  });
});
