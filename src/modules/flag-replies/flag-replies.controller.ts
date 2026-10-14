import type { FastifyReply, FastifyRequest } from 'fastify';
import { toFlagResponse } from '../flags/flags.mapper.js';
import type { ReplyFlagBody } from './flag-replies.schema.js';
import type { FlagRepliesService } from './flag-replies.service.js';

export class FlagRepliesController {
  constructor(private readonly flagRepliesService: FlagRepliesService) {}

  reply = async (
    request: FastifyRequest<{ Params: { id: string }; Body: ReplyFlagBody }>,
    reply: FastifyReply,
  ) => {
    const userId = request.user.sub;
    const flag = await this.flagRepliesService.reply(userId, request.params.id, request.body);

    return reply.status(201).send(toFlagResponse(flag, userId));
  };
}
