import type { FastifyInstance } from 'fastify';

export function registerJsonParser(app: FastifyInstance) {
  app.addContentTypeParser('application/json', { parseAs: 'string' }, (_request, body, done) => {
    if (body === '') return done(null, undefined);

    try {
      done(null, JSON.parse(body as string));
    } catch {
      done(
        Object.assign(new Error('Malformed JSON body'), { statusCode: 400, code: 'INVALID_JSON' }),
      );
    }
  });
}
