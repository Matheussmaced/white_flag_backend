import { Prisma, type PrismaClient } from '@prisma/client';
import { toSkipTake, type PaginatedResult } from '../../shared/http/pagination.js';
import type { FlagDirection } from './flags.schema.js';

const withDetails = {
  feeling: true,
  reply: { include: { declineReason: true, acceptNote: true } },
} satisfies Prisma.FlagInclude;

export type FlagDetails = Prisma.FlagGetPayload<{ include: typeof withDetails }>;

export interface CreateFlagData {
  coupleId: string;
  senderId: string;
  receiverId: string;
  feelingId: string;
  idempotencyKey: string;
}

export interface ListFlagsParams {
  coupleId: string;
  userId: string;
  direction?: FlagDirection;
  page: number;
  perPage: number;
}

export interface FlagsRepository {
  findByIdempotencyKey(senderId: string, idempotencyKey: string): Promise<FlagDetails | null>;
  findByIdInCouple(id: string, coupleId: string): Promise<FlagDetails | null>;
  create(data: CreateFlagData): Promise<FlagDetails | null>;
  list(params: ListFlagsParams): Promise<PaginatedResult<FlagDetails>>;
  markSeen(id: string): Promise<FlagDetails>;
}

const buildDirectionFilter = (userId: string, direction?: FlagDirection) => {
  if (direction === 'SENT') return { senderId: userId };
  if (direction === 'RECEIVED') return { receiverId: userId };

  return {};
};

export class PrismaFlagsRepository implements FlagsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findByIdempotencyKey(senderId: string, idempotencyKey: string) {
    return this.prisma.flag.findUnique({
      where: { senderId_idempotencyKey: { senderId, idempotencyKey } },
      include: withDetails,
    });
  }

  findByIdInCouple(id: string, coupleId: string) {
    return this.prisma.flag.findFirst({ where: { id, coupleId }, include: withDetails });
  }

  async create(data: CreateFlagData) {
    try {
      return await this.prisma.flag.create({ data, include: withDetails });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return null;
      }

      throw error;
    }
  }

  async list({ coupleId, userId, direction, page, perPage }: ListFlagsParams) {
    const where = { coupleId, ...buildDirectionFilter(userId, direction) };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.flag.findMany({
        where,
        include: withDetails,
        orderBy: { createdAt: 'desc' },
        ...toSkipTake({ page, perPage }),
      }),
      this.prisma.flag.count({ where }),
    ]);

    return { items, total, page, perPage };
  }

  async markSeen(id: string) {
    await this.prisma.flag.updateMany({
      where: { id, seenAt: null },
      data: { seenAt: new Date() },
    });

    return this.prisma.flag.findUniqueOrThrow({ where: { id }, include: withDetails });
  }
}
