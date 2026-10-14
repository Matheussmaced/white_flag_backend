import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { errorResponses } from '../../shared/http/error-response.js';

const healthResponseSchema = z
  .object({
    status: z.literal('ok').meta({ description: 'Estado do serviço' }),
    uptime: z.number().meta({ description: 'Tempo de atividade do processo, em segundos' }),
  })
  .meta({ example: { status: 'ok', uptime: 123.45 } });

export const healthRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/health',
    {
      config: { rateLimit: false },
      schema: {
        tags: ['health'],
        summary: 'Verificar disponibilidade do serviço',
        description:
          'Informa se a API está no ar e há quanto tempo o processo está ativo. Não consulta o banco de dados, por isso serve para monitoramento e health checks de infraestrutura.',
        response: {
          200: healthResponseSchema.meta({ description: 'Serviço em funcionamento' }),
          ...errorResponses(),
        },
      },
    },
    async () => ({ status: 'ok' as const, uptime: process.uptime() }),
  );
};
