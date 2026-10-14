import { z } from 'zod';

const hideNotificationTextSchema = z.boolean().meta({
  description:
    'Quando verdadeiro, as notificações push recebidas não mostram nome nem conteúdo na tela de bloqueio',
  example: false,
});

const hotModeEnabledSchema = z.boolean().meta({
  description: 'Quando verdadeiro, o usuário pode enviar bandeiras do modo hot',
  example: false,
});

export const settingsResponseSchema = z.object({
  hideNotificationText: hideNotificationTextSchema,
  hotModeEnabled: hotModeEnabledSchema,
});

export const updateSettingsBodySchema = z
  .object({
    hideNotificationText: hideNotificationTextSchema.optional(),
    hotModeEnabled: hotModeEnabledSchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Informe ao menos uma preferência para atualizar',
  });

export type SettingsResponse = z.infer<typeof settingsResponseSchema>;
export type UpdateSettingsInput = z.infer<typeof updateSettingsBodySchema>;
