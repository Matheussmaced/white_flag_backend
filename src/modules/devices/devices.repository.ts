import type { DevicePlatform, PrismaClient } from '@prisma/client';

export interface DevicesRepository {
  upsertByToken(userId: string, token: string, platform: DevicePlatform): Promise<void>;
  findTokensByUserId(userId: string): Promise<string[]>;
  deleteByTokens(tokens: string[]): Promise<void>;
}

export class PrismaDevicesRepository implements DevicesRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async upsertByToken(userId: string, token: string, platform: DevicePlatform) {
    await this.prisma.device.upsert({
      where: { token },
      update: { userId, platform },
      create: { userId, token, platform },
    });
  }

  async findTokensByUserId(userId: string) {
    const devices = await this.prisma.device.findMany({
      where: { userId },
      select: { token: true },
    });

    return devices.map((device) => device.token);
  }

  async deleteByTokens(tokens: string[]) {
    await this.prisma.device.deleteMany({ where: { token: { in: tokens } } });
  }
}
