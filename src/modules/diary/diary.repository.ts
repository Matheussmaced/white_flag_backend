import type { DiaryEntry, PrismaClient } from '@prisma/client';
import { toDbDate } from '../../lib/date.js';
import type { UpsertDiaryInput } from './diary.schema.js';

export interface DiaryEntryData {
  note: string | null;
  starred: boolean;
  mood: string | null;
  togetherMoment: boolean;
}

export interface DiaryRepository {
  listByYear(userId: string, year: number): Promise<DiaryEntry[]>;
  upsert(userId: string, date: string, data: DiaryEntryData): Promise<DiaryEntry>;
  delete(userId: string, date: string): Promise<boolean>;
}

export const toEntryData = (input: UpsertDiaryInput): DiaryEntryData => ({
  note: input.note?.length ? input.note : null,
  starred: input.starred,
  mood: input.mood ?? null,
  togetherMoment: input.togetherMoment,
});

export class PrismaDiaryRepository implements DiaryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  listByYear(userId: string, year: number) {
    return this.prisma.diaryEntry.findMany({
      where: {
        userId,
        date: { gte: toDbDate(`${year}-01-01`), lt: toDbDate(`${year + 1}-01-01`) },
      },
      orderBy: { date: 'asc' },
    });
  }

  upsert(userId: string, date: string, data: DiaryEntryData) {
    const dbDate = toDbDate(date);

    return this.prisma.diaryEntry.upsert({
      where: { userId_date: { userId, date: dbDate } },
      update: data,
      create: { ...data, userId, date: dbDate },
    });
  }

  async delete(userId: string, date: string) {
    const { count } = await this.prisma.diaryEntry.deleteMany({
      where: { userId, date: toDbDate(date) },
    });

    return count > 0;
  }
}
