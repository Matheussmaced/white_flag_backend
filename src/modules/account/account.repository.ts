import type { PrismaClient } from '@prisma/client';

export interface AccountRepository {
  deleteUserData(userId: string): Promise<void>;
}

export class PrismaAccountRepository implements AccountRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async deleteUserData(userId: string) {
    await this.prisma.$transaction(async (tx) => {
      const memberships = await tx.coupleMember.findMany({
        where: { userId },
        select: { coupleId: true },
      });
      const coupleIds = memberships.map((membership) => membership.coupleId);

      await tx.couple.updateMany({
        where: { id: { in: coupleIds }, status: 'ACTIVE' },
        data: { status: 'ENDED', endedAt: new Date() },
      });
      await tx.coupleMember.updateMany({
        where: { coupleId: { in: coupleIds } },
        data: { activeUserId: null },
      });
      await tx.user.delete({ where: { id: userId } });
      await tx.couple.deleteMany({
        where: { id: { in: coupleIds }, members: { none: {} } },
      });
    });
  }
}
