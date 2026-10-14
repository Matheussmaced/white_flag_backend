import type { FastifyReply, FastifyRequest } from 'fastify';
import type { PresenceService } from './presence.service.js';

export class PresenceController {
  constructor(private readonly presenceService: PresenceService) {}

  ping = async (request: FastifyRequest, reply: FastifyReply) => {
    await this.presenceService.ping(request.user.sub);

    return reply.status(204).send();
  };
}
