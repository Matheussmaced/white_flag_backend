import type { User } from '@prisma/client';
import { NotFoundError } from '../../shared/errors/index.js';
import type { UsersRepository } from '../users/users.repository.js';
import type { UpdateSettingsInput } from './settings.schema.js';

export class SettingsService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async get(userId: string): Promise<User> {
    const user = await this.usersRepository.findById(userId);

    if (!user) throw new NotFoundError('Usuário não encontrado');

    return user;
  }

  async update(userId: string, input: UpdateSettingsInput): Promise<User> {
    await this.get(userId);

    return this.usersRepository.updateSettings(userId, input);
  }
}
