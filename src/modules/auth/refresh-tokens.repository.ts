import type { PrismaClient, RefreshToken } from '@prisma/client';

export interface CreateRefreshTokenData {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}

export interface RefreshTokensRepository {
  create(data: CreateRefreshTokenData): Promise<void>;
  findByHash(tokenHash: string): Promise<RefreshToken | null>;
  revokeIfActive(id: string): Promise<boolean>;
  revokeAllByUser(userId: string): Promise<void>;
}

export class PrismaRefreshTokensRepository implements RefreshTokensRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateRefreshTokenData) {
    await this.prisma.refreshToken.create({ data });
  }

  findByHash(tokenHash: string) {
    return this.prisma.refreshToken.findUnique({ where: { tokenHash } });
  }

  async revokeIfActive(id: string) {
    const { count } = await this.prisma.refreshToken.updateMany({
      where: { id, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return count > 0;
  }

  async revokeAllByUser(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
