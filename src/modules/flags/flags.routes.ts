import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { createPushSender } from '../../lib/push-sender.js';
import { prisma } from '../../lib/prisma.js';
import { errorResponses } from '../../shared/http/error-response.js';
import { perUserRateLimit } from '../../shared/http/rate-limit.js';
import { CouplesService } from '../couples/couples.service.js';
import { PrismaCouplesRepository } from '../couples/couples.repository.js';
import { PrismaDevicesRepository } from '../devices/devices.repository.js';
import { PrismaFeelingsRepository } from '../feelings/feelings.repository.js';
import { FeelingsService } from '../feelings/feelings.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { PrismaUsersRepository } from '../users/users.repository.js';
import { UsersService } from '../users/users.service.js';
import { FlagsController } from './flags.controller.js';
import { PrismaFlagsRepository } from './flags.repository.js';
import {
  createFlagBodySchema,
  createFlagHeadersSchema,
  flagIdParamsSchema,
  flagResponseSchema,
  listFlagsQuerySchema,
  listFlagsResponseSchema,
} from './flags.schema.js';
import { FlagsService } from './flags.service.js';

export const flagsRoutes: FastifyPluginAsyncZod = async (app) => {
  const usersService = new UsersService(new PrismaUsersRepository(prisma));
  const couplesService = new CouplesService(new PrismaCouplesRepository(prisma), usersService);
  const feelingsService = new FeelingsService(new PrismaFeelingsRepository(prisma));
  const notificationsService = new NotificationsService(
    new PrismaDevicesRepository(prisma),
    createPushSender(app.log),
    app.log,
  );
  const flagsService = new FlagsService(
    new PrismaFlagsRepository(prisma),
    couplesService,
    feelingsService,
    notificationsService,
  );
  const controller = new FlagsController(flagsService);

  app.post(
    '/',
    {
      onRequest: [app.authenticate],
      config: { rateLimit: perUserRateLimit(60, '1 minute') },
      schema: {
        tags: ['flags'],
        summary: 'Enviar uma bandeira ao par',
        description:
          'Envia ao par o sentimento escolhido e dispara a notificação push. Exige um casal ativo (403 COUPLE_REQUIRED). A requisição é idempotente: o cabeçalho Idempotency-Key identifica o envio, e reenviar a mesma chave (por exemplo após timeout) não duplica a bandeira nem a notificação, retornando a bandeira original com status 200 em vez de 201. Reutilizar a chave com outro sentimento retorna 409 IDEMPOTENCY_KEY_REUSED. Sentimentos do modo HOT exigem que o remetente tenha ativado o modo hot nos ajustes (403 HOT_MODE_DISABLED). A notificação respeita a preferência do destinatário de esconder o texto na tela de bloqueio.',
        security: [{ bearerAuth: [] }],
        headers: createFlagHeadersSchema,
        body: createFlagBodySchema,
        response: {
          200: flagResponseSchema.meta({
            description: 'Bandeira já registrada com a mesma chave (reenvio)',
          }),
          201: flagResponseSchema.meta({ description: 'Bandeira enviada' }),
          ...errorResponses(400, 401, 403, 404, 409),
        },
      },
    },
    controller.create,
  );

  app.get(
    '/',
    {
      onRequest: [app.authenticate],
      schema: {
        tags: ['flags'],
        summary: 'Listar as bandeiras do casal',
        description:
          'Lista, da mais recente para a mais antiga e com paginação, as bandeiras trocadas no casal ativo. Cada item informa se foi enviada (SENT) ou recebida (RECEIVED) pelo usuário autenticado e se já foi visualizada. Use direction para filtrar. Exige um casal ativo.',
        security: [{ bearerAuth: [] }],
        querystring: listFlagsQuerySchema,
        response: {
          200: listFlagsResponseSchema.meta({ description: 'Página de bandeiras' }),
          ...errorResponses(400, 401, 403),
        },
      },
    },
    controller.list,
  );

  app.post(
    '/:id/seen',
    {
      onRequest: [app.authenticate],
      schema: {
        tags: ['flags'],
        summary: 'Marcar uma bandeira como vista',
        description:
          'Registra que o usuário visualizou a bandeira recebida. Apenas quem recebeu pode marcá-la (403 NOT_FLAG_RECEIVER). É idempotente: marcar novamente mantém a data da primeira visualização. Bandeiras de outros casais retornam 404.',
        security: [{ bearerAuth: [] }],
        params: flagIdParamsSchema,
        response: {
          200: flagResponseSchema.meta({ description: 'Bandeira marcada como vista' }),
          ...errorResponses(400, 401, 403, 404),
        },
      },
    },
    controller.markSeen,
  );
};
