import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { prisma } from '../../lib/prisma.js';
import { errorResponses } from '../../shared/http/error-response.js';
import { UsersController } from './users.controller.js';
import { PrismaUsersRepository } from './users.repository.js';
import { userResponseSchema } from './users.schema.js';
import { UsersService } from './users.service.js';

export const usersRoutes: FastifyPluginAsyncZod = async (app) => {
  const usersRepository = new PrismaUsersRepository(prisma);
  const usersService = new UsersService(usersRepository);
  const controller = new UsersController(usersService);

  app.get(
    '/me',
    {
      onRequest: [app.authenticate],
      schema: {
        tags: ['users'],
        summary: 'Obter o perfil do usuário autenticado',
        description:
          'Retorna os dados da pessoa dona do token de acesso, incluindo o código de pareamento (pairCode) que ela deve compartilhar com o par. Use ao abrir o app para carregar a sessão.',
        security: [{ bearerAuth: [] }],
        response: {
          200: userResponseSchema.meta({ description: 'Perfil do usuário autenticado' }),
          ...errorResponses(401, 404),
        },
      },
    },
    controller.me,
  );
};
