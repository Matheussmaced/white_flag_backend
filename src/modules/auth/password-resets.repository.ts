import type { PasswordResetToken, PrismaClient } from '@prisma/client';

export interface CreatePasswordResetData {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}

export interface ApplyPasswordResetData {
  tokenId: string;
  userId: string;
  passwordHash: string;
}

export interface PasswordResetsRepository {
  create(data: CreatePasswordResetData): Promise<void>;
  findByHash(tokenHash: string): Promise<PasswordResetToken | null>;
  apply(data: ApplyPasswordResetData): Promise<void>;
}

export class PrismaPasswordResetsRepository implements PasswordResetsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreatePasswordResetData) {
    await this.prisma.passwordResetToken.create({ data });
  }

  findByHash(tokenHash: string) {
    return this.prisma.passwordResetToken.findUnique({ where: { tokenHash } });
  }

  async apply({ tokenId, userId, passwordHash }: ApplyPasswordResetData) {
    const now = new Date();

    await this.prisma.$transaction([
      this.prisma.passwordResetToken.update({ where: { id: tokenId }, data: { usedAt: now } }),
      this.prisma.user.update({ where: { id: userId }, data: { passwordHash } }),
      this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: now },
      }),
    ]);
  }
}
