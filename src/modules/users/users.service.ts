import type { User } from '@prisma/client';
import { ConflictError, NotFoundError } from '../../shared/errors/index.js';
import { generatePairCode } from './pair-code.js';
import type { UsersRepository } from './users.repository.js';
import type { CreateUserInput } from './users.schema.js';

const MAX_PAIR_CODE_ATTEMPTS = 5;

export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async getById(id: string): Promise<User> {
    const user = await this.usersRepository.findById(id);

    if (!user) throw new NotFoundError('Usuário não encontrado');

    return user;
  }

  findByPairCode(pairCode: string): Promise<User | null> {
    return this.usersRepository.findByPairCode(pairCode);
  }

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findByEmail(email);
  }

  async create(input: CreateUserInput): Promise<User> {
    const existing = await this.usersRepository.findByEmail(input.email);

    if (existing) throw new ConflictError('Este e-mail já está em uso');

    const pairCode = await this.generateUniquePairCode();

    return this.usersRepository.create({ ...input, pairCode });
  }

  private async generateUniquePairCode(): Promise<string> {
    for (let attempt = 0; attempt < MAX_PAIR_CODE_ATTEMPTS; attempt++) {
      const pairCode = generatePairCode();
      const taken = await this.usersRepository.findByPairCode(pairCode);

      if (!taken) return pairCode;
    }

    throw new ConflictError(
      'Não foi possível gerar um código de pareamento único. Tente novamente.',
    );
  }
}
