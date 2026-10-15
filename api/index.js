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
    }

    response.statusCode = 500;
    response.setHeader('content-type', 'application/json');
    response.end(JSON.stringify(body));
  }
}
