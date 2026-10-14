import { z } from 'zod';

export const nameSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .meta({ description: 'Nome completo', example: 'Maria Souza' });

export const emailSchema = z
  .email()
  .max(180)
  .transform((value) => value.toLowerCase())
  .meta({ description: 'E-mail único, armazenado em minúsculas', example: 'maria@exemplo.com' });

export const userResponseSchema = z.object({
  id: z.uuid().meta({
    description: 'Identificador do usuário',
    example: '3f0c1c1e-6a53-4b0e-9f43-0d2c8c1b7a11',
  }),
  name: nameSchema,
  email: z.string().meta({ description: 'E-mail do usuário', example: 'maria@exemplo.com' }),
  pairCode: z.string().meta({
    description: 'Código pessoal e permanente que a outra pessoa digita para formar o casal',
    example: 'PAZ-7K2M9X',
  }),
  createdAt: z.iso
    .datetime()
    .meta({ description: 'Data de criação da conta', example: '2026-01-01T00:00:00.000Z' }),
});

export type UserResponse = z.infer<typeof userResponseSchema>;

export interface CreateUserInput {
  name: string;
  email: string;
  passwordHash: string;
}
