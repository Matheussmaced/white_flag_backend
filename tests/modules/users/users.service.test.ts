import { describe, expect, it, vi } from 'vitest';
import type { UsersRepository } from '../../../src/modules/users/users.repository.js';
import { UsersService } from '../../../src/modules/users/users.service.js';
import { ConflictError, NotFoundError } from '../../../src/shared/errors/index.js';
import { makeUser } from '../../helpers/factories.js';

const makeRepository = (): UsersRepository => ({
  findById: vi.fn(),
  findByEmail: vi.fn(),
  findByPairCode: vi.fn(),
  create: vi.fn(),
  updateLastSeen: vi.fn(),
  updateSettings: vi.fn(),
});

const input = { name: 'Jane Doe', email: 'jane@example.com', passwordHash: 'hash' };

describe('UsersService', () => {
  it('creates a user with a generated pair code', async () => {
    const repository = makeRepository();
    vi.mocked(repository.findByEmail).mockResolvedValue(null);
    vi.mocked(repository.findByPairCode).mockResolvedValue(null);
    vi.mocked(repository.create).mockResolvedValue(makeUser());

    await new UsersService(repository).create(input);

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ ...input, pairCode: expect.stringMatching(/^PAZ-[A-Z2-9]{6}$/) }),
    );
  });

  it('rejects creation when the email is already in use', async () => {
    const repository = makeRepository();
    vi.mocked(repository.findByEmail).mockResolvedValue(makeUser());

    await expect(new UsersService(repository).create(input)).rejects.toBeInstanceOf(ConflictError);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('retries when the generated pair code is already taken', async () => {
    const repository = makeRepository();
    vi.mocked(repository.findByEmail).mockResolvedValue(null);
    vi.mocked(repository.findByPairCode).mockResolvedValueOnce(makeUser()).mockResolvedValue(null);
    vi.mocked(repository.create).mockResolvedValue(makeUser());

    await new UsersService(repository).create(input);

    expect(repository.findByPairCode).toHaveBeenCalledTimes(2);
  });

  it('throws NotFoundError when the user does not exist', async () => {
    const repository = makeRepository();
    vi.mocked(repository.findById).mockResolvedValue(null);

    await expect(new UsersService(repository).getById('missing')).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});
