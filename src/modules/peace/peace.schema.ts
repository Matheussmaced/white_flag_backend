import { z } from 'zod';
import { feelingModeSchema } from '../feelings/feelings.schema.js';

export const peacePathQuerySchema = z.object({
  mode: feelingModeSchema.optional().meta({
    description: 'Filtra o conteúdo por modo (NORMAL ou HOT). Sem o filtro, retorna tudo.',
  }),
});

export const peaceMadeBodySchema = z.object({
  notifyPartner: z.boolean().default(false).meta({
    description: 'Se verdadeiro, o par recebe uma notificação avisando que vocês fizeram as pazes',
    example: true,
  }),
});

export const peaceRuleResponseSchema = z.object({
  id: z.uuid().meta({ description: 'Identificador da regra' }),
  code: z.string().meta({ description: 'Código estável da regra', example: 'ouvir' }),
  text: z.string().meta({ description: 'Texto da regra', example: 'Ouvir sem interromper' }),
  mode: feelingModeSchema,
});

export const peaceStepResponseSchema = z.object({
  id: z.uuid().meta({ description: 'Identificador do passo' }),
  code: z.string().meta({ description: 'Código estável do passo', example: 'respirar' }),
  title: z.string().meta({ description: 'Título do passo', example: 'Respire' }),
  body: z.string().meta({
    description: 'Texto explicativo do passo',
    example: 'Antes de falar, respire fundo e deixe o corpo se acalmar.',
  }),
  mode: feelingModeSchema,
});

export const peacePathResponseSchema = z.object({
  rules: z.array(peaceRuleResponseSchema).meta({ description: 'Regras da boa conversa' }),
  steps: z
    .array(peaceStepResponseSchema)
    .meta({ description: 'Passos do caminho das pazes, em ordem' }),
});

export const peaceEventResponseSchema = z.object({
  id: z.uuid().meta({ description: 'Identificador do registro' }),
  notifiedPartner: z.boolean().meta({ description: 'Se o par foi avisado por notificação' }),
  createdAt: z.iso.datetime().meta({
    description: 'Quando as pazes foram registradas',
    example: '2026-03-14T22:30:00.000Z',
  }),
});

export type PeacePathQuery = z.infer<typeof peacePathQuerySchema>;
export type PeaceMadeBody = z.infer<typeof peaceMadeBodySchema>;
