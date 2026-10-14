import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PasswordHasher } from '../../../src/lib/password-hasher.js';
import type { AccountRepository } from '../../../src/modules/account/account.repository.js';
import { AccountService } from '../../../src/modules/account/account.service.js';
import type { UsersService } from '../../../src/modules/users/users.service.js';
import { NotFoundError } from '../../../src/shared/errors/index.js';
import { makeUser } from '../../helpers/factories.js';

const passwordHasher: PasswordHasher = {
  hash: async (password) => `hashed:${password}`,
  verify: async (hash, password) => hash === `hashed:${password}`,
};

describe('AccountService', () => {
  let repository: AccountRepository;
  let usersService: { getById: ReturnType<typeof vi.fn> };
  let service: AccountService;

  beforeEach(() => {
    repository = { deleteUserData: vi.fn() };
    usersService = { getById: vi.fn().mockResolvedValue(makeUser()) };
    service = new AccountService(
      repository,
      usersService as unknown as UsersService,
      passwordHasher,
    );
  });

  it('deletes the data of the user when the password matches', async () => {
    const user = makeUser();

    await service.deleteAccount(user.id, 'secret123');

    expect(repository.deleteUserData).toHaveBeenCalledWith(user.id);
  });

  it('keeps the account when the password is wrong', async () => {
    const attempt = service.deleteAccount('user-1', 'wrong');

    await expect(attempt).rejects.toMatchObject({ code: 'INVALID_PASSWORD', statusCode: 403 });
    expect(repository.deleteUserData).not.toHaveBeenCalled();
  });

  it('propagates not found for unknown users', async () => {
    usersService.getById.mockRejectedValue(new NotFoundError('Usuário não encontrado'));

    await expect(service.deleteAccount('missing', 'secret123')).rejects.toBeInstanceOf(
      NotFoundError,
    );
    expect(repository.deleteUserData).not.toHaveBeenCalled();
  });
});
