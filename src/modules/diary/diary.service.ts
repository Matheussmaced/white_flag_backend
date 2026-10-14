import type { DiaryEntry } from '@prisma/client';
import { NotFoundError, UnprocessableEntityError } from '../../shared/errors/index.js';
import { toEntryData, type DiaryRepository } from './diary.repository.js';
import type { UpsertDiaryInput } from './diary.schema.js';

export class DiaryService {
  constructor(
    private readonly diaryRepository: DiaryRepository,
    private readonly getToday: () => string,
  ) {}

  async list(userId: string, year?: number): Promise<{ year: number; items: DiaryEntry[] }> {
    const resolvedYear = year ?? Number(this.getToday().slice(0, 4));

    return {
      year: resolvedYear,
      items: await this.diaryRepository.listByYear(userId, resolvedYear),
    };
  }

  async upsert(userId: string, date: string, input: UpsertDiaryInput): Promise<DiaryEntry> {
    if (date > this.getToday()) {
      throw new UnprocessableEntityError(
        'Não é possível registrar o diário de uma data futura',
        'FUTURE_DATE',
      );
    }

    return this.diaryRepository.upsert(userId, date, toEntryData(input));
  }

  async delete(userId: string, date: string): Promise<void> {
    const deleted = await this.diaryRepository.delete(userId, date);

    if (!deleted) throw new NotFoundError('Registro do diário não encontrado');
  }
}
