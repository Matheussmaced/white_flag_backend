import { z } from 'zod';
import { paginatedResponseSchema, paginationQuerySchema } from '../../shared/http/pagination.js';
import { flagReplyResponseSchema } from '../flag-replies/flag-replies.schema.js';
import { feelingResponseSchema } from '../feelings/feelings.schema.js';

export const createFlagHeadersSchema = z.object({
  'idempotency-key': z.string().trim().min(8).max(100).meta({
    description:
      'Chave única gerada pelo app para cada bandeira. Reenviar a mesma chave nunca duplica a bandeira.',
    example: '0b9f6a52-3c1e-4a77-8d0e-6f2c41a9b7d3',
  }),
});

export const createFlagBodySchema = z.object({
  feelingId: z.uuid().meta({
    description: 'Identificador do sentimento escolhido (veja GET /feelings)',
    example: '5a1f0c2e-7b34-4d8a-9e12-3c4b5d6e7f80',
  }),
});

export const flagIdParamsSchema = z.object({
  id: z.uuid().meta({
    description: 'Identificador da bandeira',
    example: '9c2d1e0f-4b3a-4c5d-8e7f-1a2b3c4d5e6f',
  }),
});

export const directionSchema = z.enum(['SENT', 'RECEIVED']);

export const listFlagsQuerySchema = paginationQuerySchema.extend({
  direction: directionSchema.optional().meta({
    description:
      'Filtra por SENT (enviadas por mim) ou RECEIVED (recebidas por mim). Sem filtro, retorna ambas.',
  }),
});

export const flagResponseSchema = z.object({
  id: flagIdParamsSchema.shape.id,
  feeling: feelingResponseSchema,
  direction: directionSchema.meta({
    description: 'SENT se o usuário autenticado enviou a bandeira, RECEIVED se recebeu',
    example: 'SENT',
  }),
  reply: flagReplyResponseSchema.nullable().meta({
    description: 'Resposta do par à bandeira hot; nulo enquanto não houver resposta',
  }),
  seenAt: z.iso.datetime().nullable().meta({
    description: 'Quando o par visualizou a bandeira; nulo se ainda não visualizou',
    example: null,
  }),
  createdAt: z.iso
    .datetime()
    .meta({ description: 'Quando a bandeira foi enviada', example: '2026-01-01T12:00:00.000Z' }),
});

export const listFlagsResponseSchema = paginatedResponseSchema(flagResponseSchema);

export type CreateFlagBody = z.infer<typeof createFlagBodySchema>;
export type ListFlagsQuery = z.infer<typeof listFlagsQuerySchema>;
export type FlagDirection = z.infer<typeof directionSchema>;
