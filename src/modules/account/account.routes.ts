import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { Argon2PasswordHasher } from '../../lib/password-hasher.js';
import { prisma } from '../../lib/prisma.js';
import { errorResponses } from '../../shared/http/error-response.js';
import { perUserRateLimit } from '../../shared/http/rate-limit.js';
import { PrismaUsersRepository } from '../users/users.repository.js';
import { UsersService } from '../users/users.service.js';
import { AccountController } from './account.controller.js';
import { PrismaAccountRepository } from './account.repository.js';
import { deleteAccountBodySchema } from './account.schema.js';
import { AccountService } from './account.service.js';

export const accountRoutes: FastifyPluginAsyncZod = async (app) => {
  const accountService = new AccountService(
    new PrismaAccountRepository(prisma),
    new UsersService(new PrismaUsersRepository(prisma)),
    new Argon2PasswordHasher(),
  );
  const controller = new AccountController(accountService);

  app.delete(
    '/',
    {
      onRequest: [app.authenticate],
      config: { rateLimit: perUserRateLimit(5, '10 minutes') },
      schema: {
        tags: ['account'],
        summary: 'Excluir a conta e os dados do usuário',
        description:
          'Exclui definitivamente a conta do usuário autenticado e todos os seus dados, conforme a LGPD: perfil, sessões, aparelhos, diário, bandeiras enviadas e recebidas (inclusive as respostas) e registros de pazes. Se o usuário estiver em um casal, o vínculo é desfeito e o par fica livre para formar um novo casal. A ação é irreversível e exige a senha no corpo da requisição; senha incorreta retorna 403 INVALID_PASSWORD (e não 401, para o app não confundir com sessão expirada). Limitado a 5 tentativas a cada 10 minutos.',
        security: [{ bearerAuth: [] }],
        body: deleteAccountBodySchema,
        response: {
          204: z.null().meta({ description: 'Conta e dados excluídos' }),
          ...errorResponses(400, 401, 403, 404, 429),
        },
      },
    },
    controller.delete,
  );
};
