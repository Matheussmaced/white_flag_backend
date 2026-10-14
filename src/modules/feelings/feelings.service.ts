import type { Feeling, ContentMode } from '@prisma/client';
import { NotFoundError } from '../../shared/errors/index.js';
import type { FeelingsRepository } from './feelings.repository.js';

export class FeelingsService {
  constructor(private readonly feelingsRepository: FeelingsRepository) {}

  list(mode?: ContentMode): Promise<Feeling[]> {
    return this.feelingsRepository.listActive(mode);
  }

  async getActiveById(id: string): Promise<Feeling> {
    const feeling = await this.feelingsRepository.findActiveById(id);

    if (!feeling) throw new NotFoundError('Sentimento não encontrado');

    return feeling;
  }
}
