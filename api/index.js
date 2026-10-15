import { buildApp } from '../dist/app.js';

let appPromise;

const getApp = () => {
  appPromise ??= buildApp().then(async (app) => {
    await app.ready();

    return app;
  });

  return appPromise;
};

export default async function handler(request, response) {
  const app = await getApp();

  app.server.emit('request', request, response);
}
