import type { FastifyBaseLogger } from 'fastify';
import { env } from '../config/env.js';

export interface Mailer {
  sendPasswordReset(params: { email: string; token: string }): Promise<void>;
}

export class LogMailer implements Mailer {
  constructor(private readonly logger: FastifyBaseLogger) {}

  async sendPasswordReset({ email, token }: { email: string; token: string }) {
    if (env.NODE_ENV === 'production') {
      this.logger.warn('Mail provider not configured, password reset email was not sent');
      return;
    }

    this.logger.info({ email, token }, 'Password reset requested');
  }
}
