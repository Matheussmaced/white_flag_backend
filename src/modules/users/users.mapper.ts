import type { User } from '@prisma/client';
import type { UserResponse } from './users.schema.js';

export const toUserResponse = (user: User): UserResponse => ({
  id: user.id,
  name: user.name,
  email: user.email,
  pairCode: user.pairCode,
  createdAt: user.createdAt.toISOString(),
});
