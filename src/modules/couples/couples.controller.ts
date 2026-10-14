import type { FastifyReply, FastifyRequest } from 'fastify';
import { toCoupleResponse } from './couples.mapper.js';
import type { JoinCoupleInput } from './couples.schema.js';
import type { CouplesService } from './couples.service.js';

export class CouplesController {
  constructor(
    private readonly couplesService: CouplesService,
    private readonly onlineWindowSeconds: number,
  ) {}

  join = async (request: FastifyRequest<{ Body: JoinCoupleInput }>, reply: FastifyReply) => {
    const userId = request.user.sub;
    const couple = await this.couplesService.join(userId, request.body.pairCode);

    return reply.status(201).send(toCoupleResponse(couple, userId, this.presence()));
  };

  get = async (request: FastifyRequest) => {
    const userId = request.user.sub;
    const couple = await this.couplesService.getCouple(userId);

    return toCoupleResponse(couple, userId, this.presence());
  };

  disconnect = async (request: FastifyRequest, reply: FastifyReply) => {
    await this.couplesService.disconnect(request.user.sub);

    return reply.status(204).send();
  };

  private presence() {
    return { now: new Date(), onlineWindowSeconds: this.onlineWindowSeconds };
  }
}
