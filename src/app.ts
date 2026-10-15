import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import Fastify from 'fastify';
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import { env } from './config/env.js';
import { parseCorsOrigins } from './config/cors.js';
import './config/zod.js';
import { prisma } from './lib/prisma.js';
import { accountRoutes } from './modules/account/account.routes.js';
import { presenceRoutes } from './modules/presence/presence.routes.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { couplesRoutes } from './modules/couples/couples.routes.js';
import { catalogsRoutes } from './modules/catalogs/catalogs.routes.js';
import { diaryRoutes } from './modules/diary/diary.routes.js';
import { devicesRoutes } from './modules/devices/devices.routes.js';
import { feelingsRoutes } from './modules/feelings/feelings.routes.js';
import { flagRepliesRoutes } from './modules/flag-replies/flag-replies.routes.js';
import { flagsRoutes } from './modules/flags/flags.routes.js';
import { peaceRoutes } from './modules/peace/peace.routes.js';
import { healthRoutes } from './modules/health/health.routes.js';
import { settingsRoutes } from './modules/settings/settings.routes.js';
import { usersRoutes } from './modules/users/users.routes.js';
import { authPlugin } from './plugins/auth.js';
import { rateLimitPlugin } from './plugins/rate-limit.js';
import { registerJsonParser } from './plugins/json-parser.js';
import { registerErrorHandler } from './plugins/error-handler.js';
import { registerSwagger, registerSwaggerUi } from './plugins/swagger.js';

const BODY_LIMIT_BYTES = 100 * 1024;

export async function buildApp() {
  const app = Fastify({
    logger:
      env.NODE_ENV === 'test'
        ? false
        : { level: env.LOG_LEVEL, redact: ['req.headers.authorization', 'req.headers.cookie'] },
    trustProxy: env.TRUST_PROXY,
    bodyLimit: BODY_LIMIT_BYTES,
  }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  registerErrorHandler(app);
  registerJsonParser(app);

  if (env.DOCS_ENABLED) await registerSwagger(app);

  await app.register(helmet, { contentSecurityPolicy: env.DOCS_ENABLED ? false : undefined });
  await app.register(cors, { origin: parseCorsOrigins(env.CORS_ORIGIN) });

  await app.register(authPlugin);
  await app.register(rateLimitPlugin);

  if (env.DOCS_ENABLED) await registerSwaggerUi(app);

  await app.register(healthRoutes);
  await app.register(authRoutes, { prefix: '/auth' });
  await app.register(usersRoutes);
  await app.register(couplesRoutes, { prefix: '/couple' });
  await app.register(feelingsRoutes, { prefix: '/feelings' });
  await app.register(flagsRoutes, { prefix: '/flags' });
  await app.register(flagRepliesRoutes, { prefix: '/flags' });
  await app.register(catalogsRoutes);
  await app.register(diaryRoutes, { prefix: '/diary' });
  await app.register(peaceRoutes, { prefix: '/peace' });
  await app.register(settingsRoutes, { prefix: '/settings' });
  await app.register(presenceRoutes, { prefix: '/presence' });
  await app.register(accountRoutes, { prefix: '/account' });
  await app.register(devicesRoutes, { prefix: '/devices' });

  app.addHook('onClose', async () => {
    await prisma.$disconnect();
  });

  return app;
}
