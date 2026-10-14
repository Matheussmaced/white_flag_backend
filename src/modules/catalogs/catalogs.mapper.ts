import type { ContentMode } from '@prisma/client';
import type { CatalogItemResponse } from './catalogs.schema.js';

interface CatalogItem {
  id: string;
  code: string;
  label: string;
  mode: ContentMode;
}

export const toCatalogItemResponse = (item: CatalogItem): CatalogItemResponse => ({
  id: item.id,
  code: item.code,
  label: item.label,
  mode: item.mode,
});
