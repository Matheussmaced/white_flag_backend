import { z } from 'zod';

export const paginationQuerySchema = z.object({
  page: z.coerce
    .number()
    .int()
    .min(1)
    .default(1)
    .meta({ description: 'Número da página, começando em 1' }),
  perPage: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .default(20)
    .meta({ description: 'Itens por página, no máximo 100' }),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
}

export const paginatedResponseSchema = <T extends z.ZodType>(item: T) =>
  z.object({
    items: z.array(item),
    total: z.number().int().meta({ description: 'Total de itens existentes' }),
    page: z.number().int().meta({ description: 'Página atual' }),
    perPage: z.number().int().meta({ description: 'Itens por página' }),
  });

export const toSkipTake = ({ page, perPage }: PaginationQuery) => ({
  skip: (page - 1) * perPage,
  take: perPage,
});
