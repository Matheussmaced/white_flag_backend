import { Prisma, type FlagReplyType, type PrismaClient } from '@prisma/client';

export interface CreateFlagReplyData {
  flagId: string;
  responderId: string;
  type: FlagReplyType;
  declineReasonId?: string;
  acceptNoteId?: string;
}

export interface FlagRepliesRepository {
  create(data: CreateFlagReplyData): Promise<boolean>;
}

export class PrismaFlagRepliesRepository implements FlagRepliesRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateFlagReplyData) {
    try {
      await this.prisma.flagReply.create({ data });

      return true;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return false;
      }

      throw error;
    }
  }
}
