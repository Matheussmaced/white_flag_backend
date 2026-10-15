import jwt from '@fastify/jwt';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { env } from '../config/env.js';
import { UnauthorizedError } from '../shared/errors/index.js';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { sub: string };
    user: { sub: string };
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest) => Promise<void>;
  }
}

const JWT_ALGORITHM = 'HS256';
const JWT_ISSUER = 'white-flag-api';

export const authPlugin = fp(async (app: FastifyInstance) => {
  await app.register(jwt, {
    secret: env.JWT_ACCESS_SECRET,
    sign: { algorithm: JWT_ALGORITHM, iss: JWT_ISSUER, expiresIn: env.ACCESS_TOKEN_TTL_SECONDS },
    verify: { algorithms: [JWT_ALGORITHM], allowedIss: JWT_ISSUER },
  });

  app.decorate('authenticate', async (request: FastifyRequest) => {
    try {
      await request.jwtVerify();
    } catch {
      throw new UnauthorizedError('Token de acesso inválido ou expirado');
    }
  });
});
