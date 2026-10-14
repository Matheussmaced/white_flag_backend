import { z } from 'zod';
import { feelingModeSchema } from '../feelings/feelings.schema.js';

export const listCatalogQuerySchema = z.object({
  mode: feelingModeSchema.optional().meta({
    description: 'Filtra os itens por modo (NORMAL ou HOT). Sem o filtro, retorna todos.',
  }),
});

export const catalogItemResponseSchema = z.object({
  id: z.uuid().meta({
    description: 'Identificador do item',
    example: '2b7c9d10-5e6f-4a1b-8c3d-9e0f1a2b3c4d',
  }),
  code: z.string().meta({ description: 'Código estável do item', example: 'cansaco' }),
  label: z
    .string()
    .meta({ description: 'Texto do item para exibição', example: 'Estou muito cansado(a) hoje' }),
  mode: feelingModeSchema,
});

export const catalogListResponseSchema = z.object({
  items: z.array(catalogItemResponseSchema),
});

export type ListCatalogQuery = z.infer<typeof listCatalogQuerySchema>;
export type CatalogItemResponse = z.infer<typeof catalogItemResponseSchema>;
