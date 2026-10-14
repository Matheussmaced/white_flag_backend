const MS_PER_SECOND = 1000;

export const isOnline = (lastSeenAt: Date | null, now: Date, windowSeconds: number): boolean =>
  lastSeenAt !== null && now.getTime() - lastSeenAt.getTime() <= windowSeconds * MS_PER_SECOND;
