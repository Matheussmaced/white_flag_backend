import { describe, expect, it, vi } from 'vitest';
import { PresenceService } from '../../../src/modules/presence/presence.service.js';
import type { UsersRepository } from '../../../src/modules/users/users.repository.js';

describe('PresenceService', () => {
  it('stores the current time as the last activity of the user', async () => {
    const now = new Date('2026-03-14T12:00:00.000Z');
    const repository = { updateLastSeen: vi.fn() } as unknown as UsersRepository;

    await new PresenceService(repository, () => now).ping('user-1');

    expect(repository.updateLastSeen).toHaveBeenCalledWith('user-1', now);
  });
});
