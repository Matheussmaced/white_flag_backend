import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { errorResponses } from '../../shared/http/error-response.js';
import { perUserRateLimit } from '../../shared/http/rate-limit.js';
import { PrismaUsersRepository } from '../users/users.repository.js';
import { PresenceController } from './presence.controller.js';
import { PresenceService } from './presence.service.js';

export const presenceRoutes: FastifyPluginAsyncZod = async (app) => {
  const presenceService = new PresenceService(new PrismaUsersRepository(prisma));
  const controller = new PresenceController(presenceService);

  app.post(
    '/ping',
    {
      onRequest: [app.authenticate],
      config: { rateLimit: perUserRateLimit(30, '1 minute') },
      schema: {
        tags: ['presence'],
        summary: 'Sinalizar que o usuário está ativo',
        description:
          'Atualiza o momento da última atividade do usuário autenticado. O app deve chamar este endpoint ao abrir e periodicamente (por exemplo, a cada minuto) enquanto estiver em primeiro plano. O par enxerga o resultado em GET /couple (online e lastSeenAt). Limitado a 30 chamadas por minuto por usuário.',
        security: [{ bearerAuth: [] }],
        response: {
          204: z.null().meta({ description: 'Atividade registrada' }),
          ...errorResponses(401, 429),
        },
      },
    },
    controller.ping,
  );
};
