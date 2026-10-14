import type { PrismaClient, User } from '@prisma/client';

export interface CreateUserData {
  name: string;
  email: string;
  passwordHash: string;
  pairCode: string;
}

export interface UserSettingsData {
  hideNotificationText?: boolean;
  hotModeEnabled?: boolean;
}

export interface UsersRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByPairCode(pairCode: string): Promise<User | null>;
  create(data: CreateUserData): Promise<User>;
  updateSettings(id: string, data: UserSettingsData): Promise<User>;
  updateLastSeen(id: string, at: Date): Promise<void>;
}

export class PrismaUsersRepository implements UsersRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findByPairCode(pairCode: string) {
    return this.prisma.user.findUnique({ where: { pairCode } });
  }

  create(data: CreateUserData) {
    return this.prisma.user.create({ data });
  }

  updateSettings(id: string, data: UserSettingsData) {
    return this.prisma.user.update({ where: { id }, data });
  }

  async updateLastSeen(id: string, at: Date) {
    await this.prisma.user.updateMany({ where: { id }, data: { lastSeenAt: at } });
  }
}
