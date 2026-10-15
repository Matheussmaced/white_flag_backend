import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { prisma } from '../../lib/prisma.js';
import { errorResponses } from '../../shared/http/error-response.js';
import { PrismaCatalogsRepository } from '../catalogs/catalogs.repository.js';
import { CatalogsService } from '../catalogs/catalogs.service.js';
import { PrismaCouplesRepository } from '../couples/couples.repository.js';
import { CouplesService } from '../couples/couples.service.js';
import { PrismaFlagsRepository } from '../flags/flags.repository.js';
import { flagIdParamsSchema, flagResponseSchema } from '../flags/flags.schema.js';
import { createNotificationsService } from '../notifications/notifications.factory.js';
import { PrismaUsersRepository } from '../users/users.repository.js';
import { UsersService } from '../users/users.service.js';
import { FlagRepliesController } from './flag-replies.controller.js';
import { PrismaFlagRepliesRepository } from './flag-replies.repository.js';
import { replyFlagBodySchema } from './flag-replies.schema.js';
import { FlagRepliesService } from './flag-replies.service.js';

export const flagRepliesRoutes: FastifyPluginAsyncZod = async (app) => {
  const usersService = new UsersService(new PrismaUsersRepository(prisma));
  const couplesService = new CouplesService(new PrismaCouplesRepository(prisma), usersService);
  const notificationsService = createNotificationsService(app);
  const flagRepliesService = new FlagRepliesService(
    new PrismaFlagRepliesRepository(prisma),
    new PrismaFlagsRepository(prisma),
    couplesService,
    new CatalogsService(new PrismaCatalogsRepository(prisma)),
    notificationsService,
  );
  const controller = new FlagRepliesController(flagRepliesService);

  app.post(
    '/:id/reply',
    {
      onRequest: [app.authenticate],
      schema: {
        tags: ['flags'],
        summary: 'Responder a uma bandeira hot',
        description:
          'Quem recebeu uma bandeira do modo hot responde "topo" (type ACCEPT, com frase de aceite opcional) ou "hoje não" (type DECLINE, com motivo obrigatório em declineReasonId). Cada bandeira aceita uma única resposta: tentar responder de novo retorna 409 FLAG_ALREADY_REPLIED. Apenas o destinatário pode responder (403 NOT_FLAG_RECEIVER), bandeiras do modo normal não são respondíveis (422 FLAG_NOT_REPLYABLE) e a frase ou o motivo precisam ser do mesmo modo da bandeira (422 CATALOG_MODE_MISMATCH). Quem enviou a bandeira recebe uma notificação push com a resposta; o motivo da recusa não vai na notificação. Retorna a bandeira já com a resposta.',
        security: [{ bearerAuth: [] }],
        params: flagIdParamsSchema,
        body: replyFlagBodySchema,
        response: {
          201: flagResponseSchema.meta({ description: 'Resposta registrada' }),
          ...errorResponses(400, 401, 403, 404, 409, 422),
        },
      },
    },
    controller.reply,
  );
};
