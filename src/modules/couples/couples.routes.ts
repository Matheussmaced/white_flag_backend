import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { env } from '../../config/env.js';
import { prisma } from '../../lib/prisma.js';
import { errorResponses } from '../../shared/http/error-response.js';
import { perUserRateLimit } from '../../shared/http/rate-limit.js';
import { PrismaUsersRepository } from '../users/users.repository.js';
import { UsersService } from '../users/users.service.js';
import { CouplesController } from './couples.controller.js';
import { PrismaCouplesRepository } from './couples.repository.js';
import { coupleResponseSchema, joinCoupleBodySchema } from './couples.schema.js';
import { CouplesService } from './couples.service.js';

const JOIN_ATTEMPTS_LIMIT = perUserRateLimit(10, '10 minutes');

export const couplesRoutes: FastifyPluginAsyncZod = async (app) => {
  const usersService = new UsersService(new PrismaUsersRepository(prisma));
  const couplesService = new CouplesService(new PrismaCouplesRepository(prisma), usersService);
  const controller = new CouplesController(couplesService, env.PRESENCE_ONLINE_WINDOW_SECONDS);

  app.post(
    '/join',
    {
      onRequest: [app.authenticate],
      config: { rateLimit: JOIN_ATTEMPTS_LIMIT },
      schema: {
        tags: ['couples'],
        summary: 'Formar um casal com o código do par',
        description:
          'O usuário autenticado digita o código de pareamento da outra pessoa e o casal é formado imediatamente, sem aceite. Falha se o código for o seu próprio (422), não existir (404) ou se qualquer um dos dois já fizer parte de um casal ativo (409, com code ALREADY_PAIRED ou PARTNER_ALREADY_PAIRED). Limitado a 10 tentativas a cada 10 minutos por usuário.',
        security: [{ bearerAuth: [] }],
        body: joinCoupleBodySchema,
        response: {
          201: coupleResponseSchema.meta({ description: 'Casal formado e ativo' }),
          ...errorResponses(400, 401, 404, 409, 422, 429),
        },
      },
    },
    controller.join,
  );

  app.get(
    '/',
    {
      onRequest: [app.authenticate],
      schema: {
        tags: ['couples'],
        summary: 'Consultar o casal ativo',
        description:
          'Retorna o casal ativo do usuário autenticado com os dados do par, incluindo a presença dele: online indica atividade recente e lastSeenAt traz o último momento ativo, para o app montar textos como online agora ou visto há alguns minutos. Retorna 404 quando o usuário ainda não está em um casal, o que o app pode usar para exibir a tela de pareamento.',
        security: [{ bearerAuth: [] }],
        response: {
          200: coupleResponseSchema.meta({ description: 'Casal ativo' }),
          ...errorResponses(401, 404),
        },
      },
    },
    controller.get,
  );

  app.post(
    '/disconnect',
    {
      onRequest: [app.authenticate],
      schema: {
        tags: ['couples'],
        summary: 'Desfazer o vínculo com o par',
        description:
          'Encerra o casal ativo do usuário autenticado. A partir daí as duas pessoas ficam livres para formar um novo casal. Retorna 404 se o usuário não estiver em um casal.',
        security: [{ bearerAuth: [] }],
        response: {
          204: z.null().meta({ description: 'Casal encerrado' }),
          ...errorResponses(401, 404),
        },
      },
    },
    controller.disconnect,
  );
};
