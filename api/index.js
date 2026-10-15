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

export default async function handler(request, response) {
  try {
    const app = await getApp();

    app.server.emit('request', request, response);
  } catch (error) {
    appPromise = undefined;
    console.error('Falha ao iniciar a API:', error);

    response.statusCode = 500;
    response.setHeader('content-type', 'application/json');
    response.end(
      JSON.stringify({
        statusCode: 500,
        code: 'STARTUP_FAILURE',
        message: 'Erro interno do servidor',
      }),
    );
  }
}
