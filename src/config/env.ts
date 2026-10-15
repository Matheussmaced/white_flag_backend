import 'dotenv/config';
import { z } from 'zod';

const booleanString = (defaultValue: 'true' | 'false') =>
  z
    .enum(['true', 'false'])
    .default(defaultValue)
    .transform((value) => value === 'true');

const envObjectSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('production'),
  HOST: z.string().default('0.0.0.0'),
  PORT: z.coerce.number().int().positive().default(3333),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  CORS_ORIGIN: z.string().default('*'),
  TRUST_PROXY: booleanString('false'),
  DOCS_ENABLED: booleanString('true'),
  DOCS_USERNAME: z.string().min(1).default('docs'),
  DOCS_PASSWORD: z.string().optional(),
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

const MIN_DOCS_PASSWORD_LENGTH = 12;
const WEAK_SECRET_PATTERN = /change-?me|coloque|example|exemplo|secret|password|senha/i;

const envSchema = envObjectSchema.superRefine((value, context) => {
  if (value.NODE_ENV !== 'production') return;

  const fail = (path: string, message: string) =>
    context.addIssue({ code: 'custom', path: [path], message });

  if (value.CORS_ORIGIN === '*') {
    fail('CORS_ORIGIN', 'Em produção, defina as origens permitidas em vez de *');
  }

  if (WEAK_SECRET_PATTERN.test(value.JWT_ACCESS_SECRET)) {
    fail('JWT_ACCESS_SECRET', 'Em produção, use um segredo aleatório e não um valor de exemplo');
  }

  if (value.DOCS_ENABLED && (value.DOCS_PASSWORD?.length ?? 0) < MIN_DOCS_PASSWORD_LENGTH) {
    fail(
      'DOCS_PASSWORD',
      `Em produção, a documentação exige DOCS_PASSWORD com ao menos ${MIN_DOCS_PASSWORD_LENGTH} caracteres (ou desative com DOCS_ENABLED=false)`,
    );
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
