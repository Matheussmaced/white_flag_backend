import type { FlagDetails } from './flags.repository.js';
import type { FlagDirection } from './flags.schema.js';
import { toCatalogItemResponse } from '../catalogs/catalogs.mapper.js';
import { toFeelingResponse } from '../feelings/feelings.mapper.js';

const resolveDirection = (flag: FlagDetails, viewerId: string): FlagDirection =>
  flag.senderId === viewerId ? 'SENT' : 'RECEIVED';

const toReplyResponse = (reply: FlagDetails['reply']) =>
  reply
    ? {
        type: reply.type,
        acceptNote: reply.acceptNote ? toCatalogItemResponse(reply.acceptNote) : null,
        declineReason: reply.declineReason ? toCatalogItemResponse(reply.declineReason) : null,
        createdAt: reply.createdAt.toISOString(),
      }
    : null;

export const toFlagResponse = (flag: FlagDetails, viewerId: string) => ({
  id: flag.id,
  feeling: toFeelingResponse(flag.feeling),
  direction: resolveDirection(flag, viewerId),
  reply: toReplyResponse(flag.reply),
  seenAt: flag.seenAt?.toISOString() ?? null,
  createdAt: flag.createdAt.toISOString(),
});
