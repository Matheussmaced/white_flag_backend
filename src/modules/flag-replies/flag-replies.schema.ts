import { z } from 'zod';
import { catalogItemResponseSchema } from '../catalogs/catalogs.schema.js';

const acceptReplySchema = z.object({
  type: z.literal('ACCEPT').meta({ description: 'Topou o convite' }),
  acceptNoteId: z.uuid().optional().meta({
    description: 'Frase de aceite opcional (veja GET /flags/accept-notes)',
    example: '2b7c9d10-5e6f-4a1b-8c3d-9e0f1a2b3c4d',
  }),
});

const declineReplySchema = z.object({
  type: z.literal('DECLINE').meta({ description: 'Hoje não' }),
  declineReasonId: z.uuid().meta({
    description: 'Motivo da recusa, obrigatório (veja GET /flags/decline-reasons)',
    example: '6f1e2d3c-4b5a-4978-8a6b-5c4d3e2f1a0b',
  }),
});

export const replyFlagBodySchema = z.discriminatedUnion('type', [
  acceptReplySchema,
  declineReplySchema,
]);

export const flagReplyResponseSchema = z.object({
  type: z
    .enum(['ACCEPT', 'DECLINE'])
    .meta({ description: 'ACCEPT (topou) ou DECLINE (hoje não)', example: 'ACCEPT' }),
  acceptNote: catalogItemResponseSchema
    .nullable()
    .meta({ description: 'Frase de aceite escolhida, se houver' }),
  declineReason: catalogItemResponseSchema
    .nullable()
    .meta({ description: 'Motivo da recusa, quando DECLINE' }),
  createdAt: z.iso
    .datetime()
    .meta({ description: 'Quando a resposta foi enviada', example: '2026-01-01T12:05:00.000Z' }),
});

export type ReplyFlagBody = z.infer<typeof replyFlagBodySchema>;
