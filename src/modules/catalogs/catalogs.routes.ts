import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { prisma } from '../../lib/prisma.js';
import { errorResponses } from '../../shared/http/error-response.js';
import { CatalogsController } from './catalogs.controller.js';
import { PrismaCatalogsRepository } from './catalogs.repository.js';
import { catalogListResponseSchema, listCatalogQuerySchema } from './catalogs.schema.js';
import { CatalogsService } from './catalogs.service.js';

export const catalogsRoutes: FastifyPluginAsyncZod = async (app) => {
  const catalogsService = new CatalogsService(new PrismaCatalogsRepository(prisma));
  const controller = new CatalogsController(catalogsService);

  app.get(
    '/flags/decline-reasons',
    {
      onRequest: [app.authenticate],
      schema: {
        tags: ['catalogs'],
        summary: 'Listar os motivos de recusa',
        description:
          'Retorna os motivos que a pessoa pode escolher ao responder "hoje não" a uma bandeira do modo hot. O id do motivo escolhido deve ser enviado em declineReasonId no POST /flags/:id/reply. Use mode para filtrar por modo.',
        security: [{ bearerAuth: [] }],
        querystring: listCatalogQuerySchema,
        response: {
          200: catalogListResponseSchema.meta({ description: 'Motivos de recusa ativos' }),
          ...errorResponses(400, 401),
        },
      },
    },
    controller.declineReasons,
  );

  app.get(
    '/flags/accept-notes',
    {
      onRequest: [app.authenticate],
      schema: {
        tags: ['catalogs'],
        summary: 'Listar as frases de aceite',
        description:
          'Retorna as frases prontas que acompanham a resposta "topo" a uma bandeira do modo hot. A escolha é opcional; o id da frase escolhida pode ser enviado em acceptNoteId no POST /flags/:id/reply. Use mode para filtrar por modo.',
        security: [{ bearerAuth: [] }],
        querystring: listCatalogQuerySchema,
        response: {
          200: catalogListResponseSchema.meta({ description: 'Frases de aceite ativas' }),
          ...errorResponses(400, 401),
        },
      },
    },
    controller.acceptNotes,
  );

  app.get(
    '/games/dice/challenges',
    {
      onRequest: [app.authenticate],
      schema: {
        tags: ['catalogs'],
        summary: 'Listar os desafios do dado',
        description:
          'Retorna o catálogo de desafios do jogo do dado. O sorteio e as rodadas acontecem no app; o servidor apenas entrega os desafios. Use mode para obter somente os desafios do modo NORMAL ou HOT.',
        security: [{ bearerAuth: [] }],
        querystring: listCatalogQuerySchema,
        response: {
          200: catalogListResponseSchema.meta({ description: 'Desafios ativos' }),
          ...errorResponses(400, 401),
        },
      },
    },
    controller.diceChallenges,
  );
};
