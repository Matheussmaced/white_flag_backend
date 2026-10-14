import type { FastifyRequest } from 'fastify';

export const perUserRateLimit = (max: number, timeWindow: string) => ({
  max,
  timeWindow,
  hook: 'preHandler' as const,
  keyGenerator: (request: FastifyRequest) => request.user.sub,
});
