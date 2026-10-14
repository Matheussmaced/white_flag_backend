import { z } from 'zod';

export const deleteAccountBodySchema = z.object({
  password: z.string().min(1).meta({
    description: 'Senha atual da conta, exigida para confirmar a exclusão',
    example: 'S3nhaForte!2026',
  }),
});

export type DeleteAccountInput = z.infer<typeof deleteAccountBodySchema>;
