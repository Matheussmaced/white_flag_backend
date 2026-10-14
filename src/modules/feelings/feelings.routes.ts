import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { prisma } from '../../lib/prisma.js';
import { errorResponses } from '../../shared/http/error-response.js';
import { FeelingsController } from './feelings.controller.js';
import { PrismaFeelingsRepository } from './feelings.repository.js';
import { listFeelingsQuerySchema, listFeelingsResponseSchema } from './feelings.schema.js';
import { FeelingsService } from './feelings.service.js';

export const feelingsRoutes: FastifyPluginAsyncZod = async (app) => {
  const feelingsService = new FeelingsService(new PrismaFeelingsRepository(prisma));
  const controller = new FeelingsController(feelingsService);

  app.get(
    '/',
    {
      onRequest: [app.authenticate],
      schema: {
        tags: ['feelings'],
        summary: 'Listar os sentimentos disponíveis',
        description:
          'Retorna o catálogo de sentimentos que podem ser enviados como bandeira, na ordem de exibição. Use o filtro mode para obter apenas os sentimentos do modo NORMAL ou do modo HOT. O id retornado é o que deve ser enviado em POST /flags.',
        security: [{ bearerAuth: [] }],
        querystring: listFeelingsQuerySchema,
        response: {
          200: listFeelingsResponseSchema.meta({ description: 'Sentimentos ativos' }),
          ...errorResponses(400, 401),
        },
      },
    },
    controller.list,
  );
};
