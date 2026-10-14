import type { AuthTokens } from './auth.schema.js';

export const toTokensResponse = (tokens: AuthTokens) => ({
  ...tokens,
  tokenType: 'Bearer' as const,
});
