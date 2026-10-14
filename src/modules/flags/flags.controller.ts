import type { FastifyReply, FastifyRequest } from 'fastify';
import { toFlagResponse } from './flags.mapper.js';
import type { CreateFlagBody, ListFlagsQuery } from './flags.schema.js';
import type { FlagsService } from './flags.service.js';

export class FlagsController {
  constructor(private readonly flagsService: FlagsService) {}

  create = async (request: FastifyRequest<{ Body: CreateFlagBody }>, reply: FastifyReply) => {
    const userId = request.user.sub;
    const { flag, created } = await this.flagsService.send(userId, {
      feelingId: request.body.feelingId,
      idempotencyKey: request.headers['idempotency-key'] as string,
    });

    return reply.status(created ? 201 : 200).send(toFlagResponse(flag, userId));
  };

  list = async (request: FastifyRequest<{ Querystring: ListFlagsQuery }>) => {
    const userId = request.user.sub;
    const result = await this.flagsService.list(userId, request.query);

    return { ...result, items: result.items.map((flag) => toFlagResponse(flag, userId)) };
  };

  markSeen = async (request: FastifyRequest<{ Params: { id: string } }>) => {
    const userId = request.user.sub;
    const flag = await this.flagsService.markSeen(userId, request.params.id);

    return toFlagResponse(flag, userId);
  };
}
