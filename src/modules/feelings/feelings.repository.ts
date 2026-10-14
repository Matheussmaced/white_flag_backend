import type { Feeling, ContentMode, PrismaClient } from '@prisma/client';

export interface FeelingsRepository {
  listActive(mode?: ContentMode): Promise<Feeling[]>;
  findActiveById(id: string): Promise<Feeling | null>;
}

export class PrismaFeelingsRepository implements FeelingsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  listActive(mode?: ContentMode) {
    return this.prisma.feeling.findMany({
      where: { active: true, ...(mode ? { mode } : {}) },
      orderBy: { sortOrder: 'asc' },
    });
  }

  findActiveById(id: string) {
    return this.prisma.feeling.findFirst({ where: { id, active: true } });
  }
}
