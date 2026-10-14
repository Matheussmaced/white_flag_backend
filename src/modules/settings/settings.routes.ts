import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { prisma } from '../../lib/prisma.js';
import { errorResponses } from '../../shared/http/error-response.js';
import { PrismaUsersRepository } from '../users/users.repository.js';
import { SettingsController } from './settings.controller.js';
import { settingsResponseSchema, updateSettingsBodySchema } from './settings.schema.js';
import { SettingsService } from './settings.service.js';

export const settingsRoutes: FastifyPluginAsyncZod = async (app) => {
  const settingsService = new SettingsService(new PrismaUsersRepository(prisma));
  const controller = new SettingsController(settingsService);

  app.get(
    '/',
    {
      onRequest: [app.authenticate],
      schema: {
        tags: ['settings'],
        summary: 'Consultar as preferências do usuário',
        description:
          'Retorna as preferências do usuário autenticado: se deve esconder o texto das notificações na tela de bloqueio e se o modo hot está ativado.',
        security: [{ bearerAuth: [] }],
        response: {
          200: settingsResponseSchema.meta({ description: 'Preferências atuais' }),
          ...errorResponses(401, 404),
        },
      },
    },
    controller.get,
  );

  app.patch(
    '/',
    {
      onRequest: [app.authenticate],
      schema: {
        tags: ['settings'],
        summary: 'Atualizar as preferências do usuário',
        description:
          'Atualiza parcialmente as preferências: envie apenas os campos que mudaram (ao menos um). Com hideNotificationText ativo, as notificações recebidas passam a mostrar apenas um aviso genérico. O modo hot precisa estar ativo para enviar bandeiras hot.',
        security: [{ bearerAuth: [] }],
        body: updateSettingsBodySchema,
        response: {
          200: settingsResponseSchema.meta({ description: 'Preferências atualizadas' }),
          ...errorResponses(400, 401, 404),
        },
      },
    },
    controller.update,
  );
};
