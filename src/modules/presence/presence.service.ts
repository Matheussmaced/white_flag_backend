import type { UsersRepository } from '../users/users.repository.js';

export class PresenceService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  ping(userId: string): Promise<void> {
    return this.usersRepository.updateLastSeen(userId, this.now());
  }
}
