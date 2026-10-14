import type {
  ContentMode,
  PeaceContent,
  PeaceEvent,
  PeaceRule,
  PrismaClient,
} from '@prisma/client';

export interface CreatePeaceEventData {
  coupleId: string;
  userId: string;
  notifiedPartner: boolean;
}

export interface PeaceRepository {
  listRules(mode?: ContentMode): Promise<PeaceRule[]>;
  listContents(mode?: ContentMode): Promise<PeaceContent[]>;
  createEvent(data: CreatePeaceEventData): Promise<PeaceEvent>;
}

const activeFilter = (mode?: ContentMode) => ({ active: true, ...(mode ? { mode } : {}) });

export class PrismaPeaceRepository implements PeaceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  listRules(mode?: ContentMode) {
    return this.prisma.peaceRule.findMany({
      where: activeFilter(mode),
      orderBy: { sortOrder: 'asc' },
    });
  }

  listContents(mode?: ContentMode) {
    return this.prisma.peaceContent.findMany({
      where: activeFilter(mode),
      orderBy: { sortOrder: 'asc' },
    });
  }

  createEvent(data: CreatePeaceEventData) {
    return this.prisma.peaceEvent.create({ data });
  }
}
