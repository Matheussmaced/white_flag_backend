import type { PasswordHasher } from '../../lib/password-hasher.js';
import { ForbiddenError } from '../../shared/errors/index.js';
import type { UsersService } from '../users/users.service.js';
import type { AccountRepository } from './account.repository.js';

export class AccountService {
  constructor(
    private readonly accountRepository: AccountRepository,
    private readonly usersService: UsersService,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async deleteAccount(userId: string, password: string): Promise<void> {
    const user = await this.usersService.getById(userId);
    const validPassword = await this.passwordHasher.verify(user.passwordHash, password);

    if (!validPassword) {
      throw new ForbiddenError('Senha incorreta. A conta não foi excluída.', 'INVALID_PASSWORD');
    }

    await this.accountRepository.deleteUserData(user.id);
  }
}
