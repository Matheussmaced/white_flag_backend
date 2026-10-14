import type { FastifyBaseLogger } from 'fastify';
import { env } from '../config/env.js';

export interface PushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface PushSender {
  send(messages: PushMessage[]): Promise<string[]>;
}

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const REQUEST_TIMEOUT_MS = 5000;
const DEVICE_NOT_REGISTERED = 'DeviceNotRegistered';

interface ExpoTicket {
  status: 'ok' | 'error';
  details?: { error?: string };
}

export class ExpoPushSender implements PushSender {
  constructor(private readonly accessToken?: string) {}

  async send(messages: PushMessage[]) {
    if (messages.length === 0) return [];

    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        ...(this.accessToken ? { authorization: `Bearer ${this.accessToken}` } : {}),
      },
      body: JSON.stringify(messages.map((message) => ({ ...message, sound: 'default' }))),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) throw new Error(`Expo push request failed with status ${response.status}`);

    const { data } = (await response.json()) as { data: ExpoTicket[] };

    return messages
      .filter((_, index) => data[index]?.details?.error === DEVICE_NOT_REGISTERED)
      .map((message) => message.to);
  }
}

export class LogPushSender implements PushSender {
  constructor(private readonly logger: FastifyBaseLogger) {}

  async send(messages: PushMessage[]) {
    this.logger.info({ messages }, 'Push disabled, notification not sent');

    return [];
  }
}

export const createPushSender = (logger: FastifyBaseLogger): PushSender =>
  env.PUSH_ENABLED ? new ExpoPushSender(env.EXPO_ACCESS_TOKEN) : new LogPushSender(logger);
