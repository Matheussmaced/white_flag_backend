import 'dotenv/config';
import { z } from 'zod';

const booleanString = (defaultValue: 'true' | 'false') =>
  z
    .enum(['true', 'false'])
    .default(defaultValue)
    .transform((value) => value === 'true');

const envObjectSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().default('0.0.0.0'),
  PORT: z.coerce.number().int().positive().default(3333),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  CORS_ORIGIN: z.string().default('*'),
  TRUST_PROXY: booleanString('false'),
  DOCS_ENABLED: booleanString('true'),
  PUSH_ENABLED: booleanString('false'),
  EXPO_ACCESS_TOKEN: z.string().optional(),
  APP_TIMEZONE: z.string().default('America/Sao_Paulo'),
  JWT_ACCESS_SECRET: z.string().min(32),
  ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),
  PASSWORD_RESET_TTL_MINUTES: z.coerce.number().int().positive().default(30),
  PRESENCE_ONLINE_WINDOW_SECONDS: z.coerce.number().int().positive().default(120),
  DATABASE_URL: z.string().min(1),
});

const envSchema = envObjectSchema.superRefine((value, context) => {
  if (value.NODE_ENV === 'production' && value.CORS_ORIGIN === '*') {
    context.addIssue({
      code: 'custom',
      path: ['CORS_ORIGIN'],
      message: 'Em produção, defina as origens permitidas em vez de *',
    });
  }
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = z.prettifyError(parsed.error);
  throw new Error(`Invalid environment variables:
${details}`);
}

export const env = parsed.data;

export type Env = typeof env;
