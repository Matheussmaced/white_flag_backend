import type {
  AcceptNote,
  ContentMode,
  DeclineReason,
  DiceChallenge,
  PrismaClient,
} from '@prisma/client';

export interface CatalogsRepository {
  listDeclineReasons(mode?: ContentMode): Promise<DeclineReason[]>;
  listAcceptNotes(mode?: ContentMode): Promise<AcceptNote[]>;
  listDiceChallenges(mode?: ContentMode): Promise<DiceChallenge[]>;
  findDeclineReasonById(id: string): Promise<DeclineReason | null>;
  findAcceptNoteById(id: string): Promise<AcceptNote | null>;
}

const activeFilter = (mode?: ContentMode) => ({ active: true, ...(mode ? { mode } : {}) });

export class PrismaCatalogsRepository implements CatalogsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  listDeclineReasons(mode?: ContentMode) {
    return this.prisma.declineReason.findMany({
      where: activeFilter(mode),
      orderBy: { sortOrder: 'asc' },
    });
  }

  listAcceptNotes(mode?: ContentMode) {
    return this.prisma.acceptNote.findMany({
      where: activeFilter(mode),
      orderBy: { sortOrder: 'asc' },
    });
  }

  listDiceChallenges(mode?: ContentMode) {
    return this.prisma.diceChallenge.findMany({
      where: activeFilter(mode),
      orderBy: { sortOrder: 'asc' },
    });
  }

  findDeclineReasonById(id: string) {
    return this.prisma.declineReason.findFirst({ where: { id, active: true } });
  }

  findAcceptNoteById(id: string) {
    return this.prisma.acceptNote.findFirst({ where: { id, active: true } });
  }
}
