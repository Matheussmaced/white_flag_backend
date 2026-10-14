import { z } from 'zod';

export const joinCoupleBodySchema = z.object({
  pairCode: z
    .string()
    .trim()
    .min(1)
    .max(16)
    .transform((value) => value.toUpperCase())
    .meta({ description: 'Código de pareamento da outra pessoa', example: 'PAZ-7K2M9X' }),
});

export const coupleResponseSchema = z.object({
  id: z.uuid().meta({
    description: 'Identificador do casal',
    example: '7d9e2c44-1b3f-4a8e-9c61-5f0a2b8d3e77',
  }),
  status: z.enum(['ACTIVE', 'ENDED']).meta({
    description: 'Situação do casal: ACTIVE (ativo) ou ENDED (encerrado)',
    example: 'ACTIVE',
  }),
  createdAt: z.iso
    .datetime()
    .meta({ description: 'Data em que o casal foi formado', example: '2026-01-01T00:00:00.000Z' }),
  partner: z.object({
    id: z.uuid().meta({
      description: 'Identificador do par',
      example: 'b2c3d4e5-0000-4000-8000-000000000009',
    }),
    name: z.string().meta({ description: 'Nome do par', example: 'Leo Silva' }),
    online: z
      .boolean()
      .meta({ description: 'Se o par esteve ativo no app nos últimos instantes', example: true }),
    lastSeenAt: z.iso.datetime().nullable().meta({
      description: 'Último momento em que o par esteve ativo; nulo se nunca esteve',
      example: '2026-03-14T22:10:00.000Z',
    }),
  }),
});

export type JoinCoupleInput = z.infer<typeof joinCoupleBodySchema>;
export type CoupleResponse = z.infer<typeof coupleResponseSchema>;
