import { z } from 'zod';

const EXPO_TOKEN_PATTERN = /^Expo(nent)?PushToken\[.+\]$/;

export const registerDeviceBodySchema = z.object({
  token: z.string().trim().regex(EXPO_TOKEN_PATTERN, 'Token de push inválido').max(255).meta({
    description: 'Token de push do aparelho, obtido no app com o Expo',
    example: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
  }),
  platform: z
    .enum(['IOS', 'ANDROID'])
    .meta({ description: 'Plataforma do aparelho', example: 'ANDROID' }),
});

export type RegisterDeviceInput = z.infer<typeof registerDeviceBodySchema>;
