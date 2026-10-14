import type { Feeling } from '@prisma/client';
import type { FeelingResponse } from './feelings.schema.js';

export const toFeelingResponse = (feeling: Feeling): FeelingResponse => ({
  id: feeling.id,
  code: feeling.code,
  label: feeling.label,
  mode: feeling.mode,
});
