import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { env } from '../../config/env.js';
import { LogMailer } from '../../lib/mailer.js';
import { Argon2PasswordHasher } from '../../lib/password-hasher.js';
import { prisma } from '../../lib/prisma.js';
import { errorResponses } from '../../shared/http/error-response.js';
import { PrismaUsersRepository } from '../users/users.repository.js';
import { UsersService } from '../users/users.service.js';
import { AuthController } from './auth.controller.js';
import {
  authResponseSchema,
  forgotPasswordBodySchema,
  loginBodySchema,
  logoutBodySchema,
  refreshBodySchema,
  registerBodySchema,
  resetPasswordBodySchema,
  tokensResponseSchema,
} from './auth.schema.js';
import { AuthService } from './auth.service.js';
import { PrismaPasswordResetsRepository } from './password-resets.repository.js';
import { PrismaRefreshTokensRepository } from './refresh-tokens.repository.js';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MS_PER_MINUTE = 60 * 1000;

const rateLimit = { max: 10, timeWindow: '1 minute' };

export const authRoutes: FastifyPluginAsyncZod = async (app) => {
  const usersService = new UsersService(new PrismaUsersRepository(prisma));
  const authService = new AuthService(
    usersService,
    new PrismaRefreshTokensRepository(prisma),
    new PrismaPasswordResetsRepository(prisma),
    new Argon2PasswordHasher(),
    { sign: (userId) => app.jwt.sign({ sub: userId }) },
    new LogMailer(app.log),
    {
      accessTokenTtlSeconds: env.ACCESS_TOKEN_TTL_SECONDS,
      refreshTokenTtlMs: env.REFRESH_TOKEN_TTL_DAYS * MS_PER_DAY,
      passwordResetTtlMs: env.PASSWORD_RESET_TTL_MINUTES * MS_PER_MINUTE,
    },
  );
  const controller = new AuthController(authService);

  app.post(
    '/register',
    {
      config: { rateLimit },
      schema: {
        tags: ['auth'],
        summary: 'Cadastrar um novo usuário',
        description:
          'Cria a conta com nome, e-mail e senha, gera o código de pareamento permanente do usuário e já devolve uma sessão autenticada (tokens). Falha com 409 se o e-mail já estiver em uso.',
        body: registerBodySchema,
        response: {
          201: authResponseSchema.meta({ description: 'Conta criada e sessão iniciada' }),
          ...errorResponses(400, 409, 429),
        },
      },
    },
    controller.register,
  );

  app.post(
    '/login',
    {
      config: { rateLimit },
      schema: {
        tags: ['auth'],
        summary: 'Entrar com e-mail e senha',
        description:
          'Autentica o usuário e devolve os dados do perfil e o par de tokens (acesso e renovação). Por segurança, e-mail inexistente e senha incorreta retornam a mesma mensagem de erro 401.',
        body: loginBodySchema,
        response: {
          200: authResponseSchema.meta({ description: 'Sessão autenticada' }),
          ...errorResponses(400, 401, 429),
        },
      },
    },
    controller.login,
  );

  app.post(
    '/refresh',
    {
      config: { rateLimit },
      schema: {
        tags: ['auth'],
        summary: 'Renovar a sessão',
        description:
          'Troca um refresh token válido por um novo par de tokens, sem pedir a senha novamente. O token usado é revogado. Se um token já revogado for reutilizado, todas as sessões do usuário são encerradas por segurança.',
        body: refreshBodySchema,
        response: {
          200: tokensResponseSchema.meta({ description: 'Novo par de tokens' }),
          ...errorResponses(400, 401, 429),
        },
      },
    },
    controller.refresh,
  );

  app.post(
    '/logout',
    {
      config: { rateLimit },
      schema: {
        tags: ['auth'],
        summary: 'Encerrar a sessão',
        description:
          'Revoga o refresh token informado, encerrando a sessão daquele aparelho. É idempotente: tokens desconhecidos também retornam 204.',
        body: logoutBodySchema,
        response: {
          204: z.null().meta({ description: 'Sessão encerrada' }),
          ...errorResponses(400, 429),
        },
      },
    },
    controller.logout,
  );

  app.post(
    '/forgot-password',
    {
      config: { rateLimit },
      schema: {
        tags: ['auth'],
        summary: 'Solicitar recuperação de senha',
        description:
          'Envia ao e-mail informado um token para redefinir a senha, caso a conta exista. Sempre retorna 204, exista a conta ou não, para não revelar quais e-mails estão cadastrados.',
        body: forgotPasswordBodySchema,
        response: {
          204: z.null().meta({ description: 'Solicitação aceita' }),
          ...errorResponses(400, 429),
        },
      },
    },
    controller.forgotPassword,
  );

  app.post(
    '/reset-password',
    {
      config: { rateLimit },
      schema: {
        tags: ['auth'],
        summary: 'Redefinir a senha com o token',
        description:
          'Define uma nova senha usando o token recebido por e-mail e encerra todas as sessões ativas do usuário. O token só pode ser usado uma vez e expira após alguns minutos; token inválido ou expirado retorna 422.',
        body: resetPasswordBodySchema,
        response: {
          204: z.null().meta({ description: 'Senha atualizada' }),
          ...errorResponses(400, 422, 429),
        },
      },
    },
    controller.resetPassword,
  );
};
