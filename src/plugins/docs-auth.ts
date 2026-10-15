import { createHash, timingSafeEqual } from 'node:crypto';
import type { FastifyReply, FastifyRequest } from 'fastify';

const MAX_FAILURES = 10;
const FAILURE_WINDOW_MS = 15 * 60 * 1000;
const MAX_TRACKED_CLIENTS = 1000;
const BASIC_PREFIX = 'Basic ';

interface Credentials {
  username: string;
  password: string;
}

interface FailureRecord {
  count: number;
  resetAt: number;
}

const digest = (value: string) => createHash('sha256').update(value).digest();

const safeEqual = (a: string, b: string) => timingSafeEqual(digest(a), digest(b));

const parseBasicHeader = (header: string | undefined): Credentials | null => {
  if (!header?.startsWith(BASIC_PREFIX)) return null;

  const decoded = Buffer.from(header.slice(BASIC_PREFIX.length), 'base64').toString('utf8');
  const separator = decoded.indexOf(':');

  if (separator < 0) return null;

  return { username: decoded.slice(0, separator), password: decoded.slice(separator + 1) };
};

export function createDocsAuthHook(expected: Credentials) {
  const failures = new Map<string, FailureRecord>();

  const isBlocked = (ip: string, now: number) => {
    const record = failures.get(ip);

    if (!record || record.resetAt <= now) return false;

    return record.count >= MAX_FAILURES;
  };

  const registerFailure = (ip: string, now: number) => {
    if (failures.size >= MAX_TRACKED_CLIENTS) failures.clear();

    const record = failures.get(ip);

    if (!record || record.resetAt <= now) {
      failures.set(ip, { count: 1, resetAt: now + FAILURE_WINDOW_MS });
      return;
    }

    record.count += 1;
  };

  const reject = (reply: FastifyReply, statusCode: 401 | 429) => {
    const message =
      statusCode === 401
        ? 'Autenticação necessária para acessar a documentação'
        : 'Muitas tentativas inválidas. Tente novamente mais tarde.';

    reply
      .code(statusCode)
      .header('www-authenticate', 'Basic realm="White Flag Docs", charset="UTF-8"')
      .send({
        statusCode,
        code: statusCode === 401 ? 'UNAUTHORIZED' : 'TOO_MANY_REQUESTS',
        message,
      });
  };

  return (request: FastifyRequest, reply: FastifyReply, done: () => void) => {
    const now = Date.now();

    if (isBlocked(request.ip, now)) return reject(reply, 429);

    const credentials = parseBasicHeader(request.headers.authorization);

    if (!credentials) return reject(reply, 401);

    const validUser = safeEqual(credentials.username, expected.username);
    const validPassword = safeEqual(credentials.password, expected.password);

    if (!validUser || !validPassword) {
      registerFailure(request.ip, now);
      return reject(reply, 401);
    }

    done();
  };
}
