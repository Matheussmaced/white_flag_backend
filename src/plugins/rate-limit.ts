import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { TooManyRequestsError } from '../shared/errors/index.js';

const GLOBAL_MAX_REQUESTS = 300;
const GLOBAL_TIME_WINDOW = '1 minute';

export const rateLimitPlugin = fp(async (app: FastifyInstance) => {
  await app.register(rateLimit, {
    global: true,
    max: GLOBAL_MAX_REQUESTS,
    timeWindow: GLOBAL_TIME_WINDOW,
    errorResponseBuilder: () => new TooManyRequestsError(),
  });
});
