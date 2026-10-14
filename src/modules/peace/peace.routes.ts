import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { createPushSender } from '../../lib/push-sender.js';
import { prisma } from '../../lib/prisma.js';
import { errorResponses } from '../../shared/http/error-response.js';
import { PrismaCouplesRepository } from '../couples/couples.repository.js';
import { CouplesService } from '../couples/couples.service.js';
import { PrismaDevicesRepository } from '../devices/devices.repository.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { PrismaUsersRepository } from '../users/users.repository.js';
import { UsersService } from '../users/users.service.js';
import { PeaceController } from './peace.controller.js';
import { PrismaPeaceRepository } from './peace.repository.js';
import {
  peaceEventResponseSchema,
  peaceMadeBodySchema,
  peacePathQuerySchema,
  peacePathResponseSchema,
} from './peace.schema.js';
import { PeaceService } from './peace.service.js';

export const peaceRoutes: FastifyPluginAsyncZod = async (app) => {
  const usersService = new UsersService(new PrismaUsersRepository(prisma));
  const couplesService = new CouplesService(new PrismaCouplesRepository(prisma), usersService);
  const notificationsService = new NotificationsService(
    new PrismaDevicesRepository(prisma),
    createPushSender(app.log),
    app.log,
  );
  const peaceService = new PeaceService(
    new PrismaPeaceRepository(prisma),
    couplesService,
    notificationsService,
  );
  const controller = new PeaceController(peaceService);

  app.get(
    '/path',
    {
      onRequest: [app.authenticate],
      schema: {
        tags: ['peace'],
        summary: 'Obter o caminho das pazes',
        description:
          'Retorna o conteúdo que guia o casal a fazer as pazes: as regras da boa conversa e os passos a seguir, em ordem. Use mode para filtrar por modo (NORMAL ou HOT).',
        security: [{ bearerAuth: [] }],
        querystring: peacePathQuerySchema,
        response: {
          200: peacePathResponseSchema.meta({ description: 'Regras e passos das pazes' }),
          ...errorResponses(400, 401),
        },
      },
    },
    controller.path,
  );

  app.post(
    '/made',
    {
      onRequest: [app.authenticate],
      schema: {
        tags: ['peace'],
        summary: 'Registrar que fizeram as pazes',
        description:
          'Registra o evento "fizemos as pazes" do casal ativo. Com notifyPartner verdadeiro, o par recebe uma notificação push (respeitando a preferência dele de esconder o texto). Exige um casal ativo (403 COUPLE_REQUIRED).',
        security: [{ bearerAuth: [] }],
        body: peaceMadeBodySchema,
        response: {
          201: peaceEventResponseSchema.meta({ description: 'Pazes registradas' }),
          ...errorResponses(400, 401, 403),
        },
      },
    },
    controller.made,
  );
};
