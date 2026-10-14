import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { env } from '../../config/env.js';
import { getTodayIn } from '../../lib/date.js';
import { prisma } from '../../lib/prisma.js';
import { errorResponses } from '../../shared/http/error-response.js';
import { DiaryController } from './diary.controller.js';
import { PrismaDiaryRepository } from './diary.repository.js';
import {
  diaryDateParamsSchema,
  diaryEntryResponseSchema,
  listDiaryQuerySchema,
  listDiaryResponseSchema,
  upsertDiaryBodySchema,
} from './diary.schema.js';
import { DiaryService } from './diary.service.js';

export const diaryRoutes: FastifyPluginAsyncZod = async (app) => {
  const diaryService = new DiaryService(new PrismaDiaryRepository(prisma), () =>
    getTodayIn(env.APP_TIMEZONE),
  );
  const controller = new DiaryController(diaryService);

  app.get(
    '/',
    {
      onRequest: [app.authenticate],
      schema: {
        tags: ['diary'],
        summary: 'Listar os registros do diário de um ano',
        description:
          'Retorna, em ordem cronológica, os registros do diário do usuário autenticado no ano informado (ou no ano atual). O diário é privado: nem o par tem acesso. Ideal para montar o calendário do ano no app.',
        security: [{ bearerAuth: [] }],
        querystring: listDiaryQuerySchema,
        response: {
          200: listDiaryResponseSchema.meta({ description: 'Registros do ano' }),
          ...errorResponses(400, 401),
        },
      },
    },
    controller.list,
  );

  app.put(
    '/:date',
    {
      onRequest: [app.authenticate],
      schema: {
        tags: ['diary'],
        summary: 'Criar ou atualizar o registro de um dia',
        description:
          'Salva o registro do dia informado, criando-o ou substituindo o existente (um registro por usuário e data). Os campos não enviados voltam ao valor padrão: sem anotação, sem estrela, sem humor e sem momento a dois. A anotação tem até 500 caracteres e não é permitido registrar datas futuras (422 FUTURE_DATE), considerando o fuso horário do app.',
        security: [{ bearerAuth: [] }],
        params: diaryDateParamsSchema,
        body: upsertDiaryBodySchema,
        response: {
          200: diaryEntryResponseSchema.meta({ description: 'Registro salvo' }),
          ...errorResponses(400, 401, 422),
        },
      },
    },
    controller.upsert,
  );

  app.delete(
    '/:date',
    {
      onRequest: [app.authenticate],
      schema: {
        tags: ['diary'],
        summary: 'Apagar o registro de um dia',
        description:
          'Remove o registro do diário da data informada. Retorna 404 se não houver registro naquele dia.',
        security: [{ bearerAuth: [] }],
        params: diaryDateParamsSchema,
        response: {
          204: z.null().meta({ description: 'Registro apagado' }),
          ...errorResponses(400, 401, 404),
        },
      },
    },
    controller.delete,
  );
};
