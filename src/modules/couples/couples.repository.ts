import type { Prisma, PrismaClient } from '@prisma/client';

const withMembers = { members: { include: { user: true } } } satisfies Prisma.CoupleInclude;

export type CoupleWithMembers = Prisma.CoupleGetPayload<{ include: typeof withMembers }>;

export interface CouplesRepository {
  findActiveByUserId(userId: string): Promise<CoupleWithMembers | null>;
  createWithMembers(userIds: [string, string]): Promise<CoupleWithMembers>;
  end(coupleId: string): Promise<void>;
}

export class PrismaCouplesRepository implements CouplesRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findActiveByUserId(userId: string) {
    return this.prisma.couple.findFirst({
      where: { status: 'ACTIVE', members: { some: { userId } } },
      include: withMembers,
    });
  }

  createWithMembers(userIds: [string, string]) {
    return this.prisma.couple.create({
      data: {
        members: { create: userIds.map((userId) => ({ userId, activeUserId: userId })) },
      },
      include: withMembers,
    });
  }

  async end(coupleId: string) {
    await this.prisma.$transaction([
      this.prisma.couple.update({
        where: { id: coupleId },
        data: { status: 'ENDED', endedAt: new Date() },
      }),
      this.prisma.coupleMember.updateMany({
        where: { coupleId },
        data: { activeUserId: null },
      }),
    ]);
  }
}
