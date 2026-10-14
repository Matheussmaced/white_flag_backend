import { z } from 'zod';

export const feelingModeSchema = z.enum(['NORMAL', 'HOT']).meta({
  description: 'Modo do sentimento: NORMAL ou HOT (apenas para o modo íntimo)',
  example: 'NORMAL',
});

export const listFeelingsQuerySchema = z.object({
  mode: feelingModeSchema.optional().meta({
    description: 'Filtra os sentimentos por modo. Sem o filtro, retorna todos.',
  }),
});

export const feelingResponseSchema = z.object({
  id: z.uuid().meta({
    description: 'Identificador do sentimento',
    example: '5a1f0c2e-7b34-4d8a-9e12-3c4b5d6e7f80',
  }),
  code: z.string().meta({ description: 'Código estável do sentimento', example: 'saudade' }),
  label: z.string().meta({ description: 'Texto do sentimento', example: 'Estou com saudade' }),
  mode: feelingModeSchema,
});

export const listFeelingsResponseSchema = z.object({
  items: z.array(feelingResponseSchema),
});

export type ListFeelingsQuery = z.infer<typeof listFeelingsQuerySchema>;
export type FeelingResponse = z.infer<typeof feelingResponseSchema>;
