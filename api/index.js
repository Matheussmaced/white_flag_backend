let appPromise;

const getApp = () => {
  appPromise ??= import('../dist/app.js')
    .then(({ buildApp }) => buildApp())
    .then(async (app) => {
      await app.ready();

      return app;
    });

  return appPromise;
};

const MAX_DETAIL_LENGTH = 1500;
const PLAIN_VARIABLES = ['NODE_ENV', 'CORS_ORIGIN', 'DOCS_ENABLED', 'TRUST_PROXY', 'DOCS_USERNAME'];
const HIDDEN_VARIABLES = ['JWT_ACCESS_SECRET', 'DOCS_PASSWORD', 'DATABASE_URL'];

const describePresence = (value) => {
  if (value === undefined) return 'AUSENTE';
  if (value === '') return 'VAZIA';

  return `definida (${value.length} caracteres)`;
};

const buildRuntimeReport = () => ({
  vercelEnv: process.env.VERCEL_ENV ?? 'nao e Vercel',
  commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'desconhecido',
  variables: {
    ...Object.fromEntries(PLAIN_VARIABLES.map((name) => [name, process.env[name] ?? 'AUSENTE'])),
    ...Object.fromEntries(
      HIDDEN_VARIABLES.map((name) => [name, describePresence(process.env[name])]),
    ),
  },
});

export default async function handler(request, response) {
  try {
    const app = await getApp();

    app.server.emit('request', request, response);
  } catch (error) {
    appPromise = undefined;
    console.error('Falha ao iniciar a API:', error);

    const body = {
      statusCode: 500,
      code: 'STARTUP_FAILURE',
      message: 'Erro interno do servidor',
    };

    if (process.env.DEBUG_STARTUP === 'true') {
      body.detail = String(error?.message ?? error).slice(0, MAX_DETAIL_LENGTH);
      body.runtime = buildRuntimeReport();
    }

    response.statusCode = 500;
    response.setHeader('content-type', 'application/json');
    response.end(JSON.stringify(body));
  }
}
