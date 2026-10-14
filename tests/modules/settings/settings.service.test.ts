import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SettingsService } from '../../../src/modules/settings/settings.service.js';
import type { UsersRepository } from '../../../src/modules/users/users.repository.js';
import { NotFoundError } from '../../../src/shared/errors/index.js';
import { makeUser } from '../../helpers/factories.js';

describe('SettingsService', () => {
  let repository: UsersRepository;
  let service: SettingsService;

  beforeEach(() => {
    repository = {
      findById: vi.fn().mockResolvedValue(makeUser()),
      findByEmail: vi.fn(),
      findByPairCode: vi.fn(),
      create: vi.fn(),
      updateLastSeen: vi.fn(),
      updateSettings: vi.fn().mockResolvedValue(makeUser({ hideNotificationText: true })),
    };
    service = new SettingsService(repository);
  });

  it('updates only the provided preferences', async () => {
    const user = await service.update('user-1', { hideNotificationText: true });

    expect(repository.updateSettings).toHaveBeenCalledWith('user-1', {
      hideNotificationText: true,
    });
    expect(user.hideNotificationText).toBe(true);
  });

  it('throws NotFoundError when the user does not exist', async () => {
    vi.mocked(repository.findById).mockResolvedValue(null);

    await expect(service.update('missing', { hotModeEnabled: true })).rejects.toBeInstanceOf(
      NotFoundError,
    );
    expect(repository.updateSettings).not.toHaveBeenCalled();
  });
});
