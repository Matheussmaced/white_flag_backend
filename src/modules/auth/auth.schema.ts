import { z } from 'zod';
import { emailSchema, nameSchema, userResponseSchema } from '../users/users.schema.js';

const newPasswordSchema = z.string().min(8).max(128).meta({
  description: 'Senha com 8 a 128 caracteres',
  example: 'S3nhaForte!2026',
});

const refreshTokenSchema = z.string().min(1).meta({
  description: 'Token de renovação opaco, retornado no cadastro, login e renovação',
  example: 'q3V7y0m1xZc9Fh2o8JrT5wKpL4aNbD6sUeGiYtXvHnM',
});

export const registerBodySchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: newPasswordSchema,
});

export const loginBodySchema = z.object({
  email: emailSchema,
  password: z.string().min(1).meta({ description: 'Senha da conta', example: 'S3nhaForte!2026' }),
});

export const refreshBodySchema = z.object({
  refreshToken: refreshTokenSchema,
});

export const logoutBodySchema = refreshBodySchema;

export const forgotPasswordBodySchema = z.object({
  email: emailSchema,
});

export const resetPasswordBodySchema = z.object({
  token: z.string().min(1).meta({
    description: 'Token de recuperação enviado ao e-mail do usuário',
    example: 'Zk3p9TqV1nXw7cYb4LhJ2sRoU8mEaDfGiN5tKyHvQ0A',
  }),
  password: newPasswordSchema,
});

export const tokensResponseSchema = z.object({
  accessToken: z.string().meta({
    description: 'JWT de curta duração, enviado como Bearer nas rotas protegidas',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzZjBjMWMxZSJ9.assinatura',
  }),
  refreshToken: refreshTokenSchema,
  tokenType: z.literal('Bearer').meta({ description: 'Tipo do token de acesso' }),
  expiresIn: z
    .number()
    .int()
    .meta({ description: 'Validade do token de acesso, em segundos', example: 900 }),
});

export const authResponseSchema = z.object({
  user: userResponseSchema,
  tokens: tokensResponseSchema,
});

export type RegisterInput = z.infer<typeof registerBodySchema>;
export type LoginInput = z.infer<typeof loginBodySchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordBodySchema>;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
