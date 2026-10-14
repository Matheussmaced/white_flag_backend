import { Prisma } from '@prisma/client';
import type { FastifyInstance } from 'fastify';
import { hasZodFastifySchemaValidationErrors } from 'fastify-type-provider-zod';
import { AppError } from '../shared/errors/index.js';

const clientErrorMessages: Record<string, string> = {
  FST_ERR_CTP_INVALID_MEDIA_TYPE: 'Tipo de conteúdo não suportado',
  FST_ERR_CTP_BODY_TOO_LARGE: 'Corpo da requisição excede o tamanho máximo permitido',
  INVALID_JSON: 'Corpo da requisição com JSON malformado',
};

const DEFAULT_CLIENT_ERROR_MESSAGE = 'Requisição inválida';

const isClientError = (error: unknown): error is { statusCode: number; code?: string } =>
  typeof error === 'object' &&
  error !== null &&
  'statusCode' in error &&
  typeof error.statusCode === 'number' &&
  error.statusCode >= 400 &&
  error.statusCode < 500;

export function registerErrorHandler(app: FastifyInstance) {
  app.setNotFoundHandler((request, reply) => {
    reply.status(404).send({
      statusCode: 404,
      code: 'ROUTE_NOT_FOUND',
      message: `Rota ${request.method} ${request.url} não encontrada`,
    });
  });

  app.setErrorHandler((error, request, reply) => {
    if (hasZodFastifySchemaValidationErrors(error)) {
      return reply.status(400).send({
        statusCode: 400,
        code: 'VALIDATION_ERROR',
        message: 'Falha na validação da requisição',
        details: error.validation,
      });
    }

    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        statusCode: error.statusCode,
        code: error.code,
        message: error.message,
      });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return reply.status(409).send({
        statusCode: 409,
        code: 'CONFLICT',
        message: 'O recurso já existe',
      });
    }

    if (isClientError(error)) {
      const code = error.code ?? 'BAD_REQUEST';

      return reply.status(error.statusCode).send({
        statusCode: error.statusCode,
        code,
        message: clientErrorMessages[code] ?? DEFAULT_CLIENT_ERROR_MESSAGE,
      });
    }

    request.log.error(error);

    return reply.status(500).send({
      statusCode: 500,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Erro interno do servidor',
    });
  });
}
