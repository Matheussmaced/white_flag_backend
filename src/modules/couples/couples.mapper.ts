import { isOnline } from '../../lib/presence.js';
import type { CoupleWithMembers } from './couples.repository.js';
import type { CoupleResponse } from './couples.schema.js';

export interface PresenceOptions {
  now: Date;
  onlineWindowSeconds: number;
}

export const findPartner = (couple: CoupleWithMembers, userId: string) =>
  couple.members.find((member) => member.userId !== userId)?.user;

export const toCoupleResponse = (
  couple: CoupleWithMembers,
  userId: string,
  presence: PresenceOptions,
): CoupleResponse => {
  const partner = findPartner(couple, userId);

  if (!partner) throw new Error(`Couple ${couple.id} has no partner for user ${userId}`);

  return {
    id: couple.id,
    status: couple.status,
    createdAt: couple.createdAt.toISOString(),
    partner: {
      id: partner.id,
      name: partner.name,
      online: isOnline(partner.lastSeenAt, presence.now, presence.onlineWindowSeconds),
      lastSeenAt: partner.lastSeenAt?.toISOString() ?? null,
    },
  };
};
