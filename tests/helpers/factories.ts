import type { Feeling, PasswordResetToken, RefreshToken, User } from '@prisma/client';
import type { FlagDetails } from '../../src/modules/flags/flags.repository.js';
import type { CoupleWithMembers } from '../../src/modules/couples/couples.repository.js';

export const makeUser = (overrides: Partial<User> = {}): User => ({
  id: '3f0c1c1e-6a53-4b0e-9f43-0d2c8c1b7a11',
  name: 'Jane Doe',
  email: 'jane@example.com',
  passwordHash: 'hashed:secret123',
  hideNotificationText: false,
  hotModeEnabled: true,
  lastSeenAt: null,
  pairCode: 'PAZ-7K2M9X',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  ...overrides,
});

export const makeRefreshToken = (overrides: Partial<RefreshToken> = {}): RefreshToken => ({
  id: 'a1b2c3d4-0000-4000-8000-000000000001',
  userId: makeUser().id,
  tokenHash: 'hash',
  expiresAt: new Date(Date.now() + 60_000),
  revokedAt: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  ...overrides,
});

export const makePasswordReset = (
  overrides: Partial<PasswordResetToken> = {},
): PasswordResetToken => ({
  id: 'a1b2c3d4-0000-4000-8000-000000000002',
  userId: makeUser().id,
  tokenHash: 'hash',
  expiresAt: new Date(Date.now() + 60_000),
  usedAt: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  ...overrides,
});

export const makeCouple = (
  user: User = makeUser(),
  partner: User = makeUser({
    id: 'b2c3d4e5-0000-4000-8000-000000000009',
    name: 'Leo Silva',
    pairCode: 'PAZ-3HQ8WN',
  }),
): CoupleWithMembers => ({
  id: '7d9e2c44-1b3f-4a8e-9c61-5f0a2b8d3e77',
  status: 'ACTIVE',
  createdAt: new Date('2026-01-02T00:00:00.000Z'),
  endedAt: null,
  members: [user, partner].map((member, index) => ({
    id: `member-${index}`,
    coupleId: '7d9e2c44-1b3f-4a8e-9c61-5f0a2b8d3e77',
    userId: member.id,
    activeUserId: member.id,
    joinedAt: new Date('2026-01-02T00:00:00.000Z'),
    user: member,
  })),
});

export const makeFeeling = (overrides: Partial<Feeling> = {}): Feeling => ({
  id: '5a1f0c2e-7b34-4d8a-9e12-3c4b5d6e7f80',
  code: 'saudade',
  label: 'Estou com saudade',
  mode: 'NORMAL',
  sortOrder: 0,
  active: true,
  ...overrides,
});

export const makeFlag = (overrides: Partial<FlagDetails> = {}): FlagDetails => ({
  id: '9c2d1e0f-4b3a-4c5d-8e7f-1a2b3c4d5e6f',
  coupleId: '7d9e2c44-1b3f-4a8e-9c61-5f0a2b8d3e77',
  senderId: makeUser().id,
  receiverId: 'b2c3d4e5-0000-4000-8000-000000000009',
  feelingId: makeFeeling().id,
  idempotencyKey: 'key-1234567890',
  seenAt: null,
  reply: null,
  createdAt: new Date('2026-01-03T00:00:00.000Z'),
  feeling: makeFeeling(),
  ...overrides,
});
