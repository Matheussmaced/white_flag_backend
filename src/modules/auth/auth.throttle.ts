import type { FastifyInstance, FastifyRequest } from 'fastify';
import { TooManyRequestsError } from '../../shared/errors/index.js';

interface EmailThrottleOptions {
  max: number;
  timeWindow: string;
}

export const extractEmailKey = (body: unknown): string | null => {
  if (typeof body !== 'object' || body === null || !('email' in body)) return null;

  const { email } = body;

  return typeof email === 'string' && email.length > 0 ? email.trim().toLowerCase() : null;
};

export function createEmailThrottle(app: FastifyInstance, options: EmailThrottleOptions) {
  const check = app.createRateLimit({
    ...options,
    keyGenerator: (request: FastifyRequest) => extractEmailKey(request.body) ?? request.ip,
  });

  return async (request: FastifyRequest) => {
    const result = await check(request);

    if (!result.isAllowed && result.isExceeded) throw new TooManyRequestsError();
  };
}
