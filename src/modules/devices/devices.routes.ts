import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { errorResponses } from '../../shared/http/error-response.js';
import { DevicesController } from './devices.controller.js';
import { PrismaDevicesRepository } from './devices.repository.js';
import { registerDeviceBodySchema } from './devices.schema.js';
import { DevicesService } from './devices.service.js';

export const devicesRoutes: FastifyPluginAsyncZod = async (app) => {
  const devicesService = new DevicesService(new PrismaDevicesRepository(prisma));
  const controller = new DevicesController(devicesService);

  app.put(
    '/',
    {
      onRequest: [app.authenticate],
      schema: {
        tags: ['devices'],
        summary: 'Registrar o token de push do aparelho',
        description:
          'Associa o token de push do aparelho ao usuário autenticado, para que ele receba notificações das bandeiras. Pode ser chamada a cada abertura do app: se o token já existir, ele apenas passa a pertencer ao usuário atual (útil quando duas pessoas usam o mesmo aparelho em momentos diferentes).',
        security: [{ bearerAuth: [] }],
        body: registerDeviceBodySchema,
        response: {
          204: z.null().meta({ description: 'Token registrado' }),
          ...errorResponses(400, 401),
        },
      },
    },
    controller.register,
  );
};
