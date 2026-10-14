import { z } from 'zod';

export const DIARY_MOODS = [
  'HAPPY',
  'LOVED',
  'GRATEFUL',
  'CALM',
  'TIRED',
  'ANXIOUS',
  'SAD',
  'ANGRY',
] as const;

const NOTE_MAX_LENGTH = 500;

export const diaryDateParamsSchema = z.object({
  date: z.iso
    .date()
    .meta({ description: 'Data do registro no formato AAAA-MM-DD', example: '2026-03-14' }),
});

export const listDiaryQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).optional().meta({
    description: 'Ano a consultar. Sem o parâmetro, usa o ano atual.',
    example: 2026,
  }),
});

export const upsertDiaryBodySchema = z.object({
  note: z.string().trim().max(NOTE_MAX_LENGTH).nullish().meta({
    description: 'Anotação do dia, de até 500 caracteres',
    example: 'Jantamos fora e rimos bastante.',
  }),
  starred: z
    .boolean()
    .default(false)
    .meta({ description: 'Se o dia foi marcado com estrela', example: true }),
  mood: z
    .enum(DIARY_MOODS)
    .nullish()
    .meta({
      description: `Humor do dia: ${DIARY_MOODS.join(', ')}`,
      example: 'HAPPY',
    }),
  togetherMoment: z.boolean().default(false).meta({
    description: 'Se houve um momento a dois neste dia',
    example: true,
  }),
});

export const diaryEntryResponseSchema = z.object({
  date: diaryDateParamsSchema.shape.date,
  note: z
    .string()
    .nullable()
    .meta({ description: 'Anotação do dia', example: 'Jantamos fora e rimos bastante.' }),
  starred: z.boolean().meta({ description: 'Dia marcado com estrela' }),
  mood: z.enum(DIARY_MOODS).nullable().meta({ description: 'Humor do dia', example: 'HAPPY' }),
  togetherMoment: z.boolean().meta({ description: 'Houve momento a dois' }),
  updatedAt: z.iso
    .datetime()
    .meta({ description: 'Última atualização do registro', example: '2026-03-14T22:10:00.000Z' }),
});

export const listDiaryResponseSchema = z.object({
  year: z.number().int().meta({ description: 'Ano consultado', example: 2026 }),
  items: z.array(diaryEntryResponseSchema),
});

export type UpsertDiaryInput = z.infer<typeof upsertDiaryBodySchema>;
export type ListDiaryQuery = z.infer<typeof listDiaryQuerySchema>;
