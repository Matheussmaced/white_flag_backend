import type { FastifyReply, FastifyRequest } from 'fastify';
import type { PeaceMadeBody, PeacePathQuery } from './peace.schema.js';
import type { PeaceService } from './peace.service.js';

export class PeaceController {
  constructor(private readonly peaceService: PeaceService) {}

  path = async (request: FastifyRequest<{ Querystring: PeacePathQuery }>) => {
    const { rules, steps } = await this.peaceService.getPath(request.query.mode);

    return {
      rules: rules.map((rule) => ({
        id: rule.id,
        code: rule.code,
        text: rule.text,
        mode: rule.mode,
      })),
      steps: steps.map((step) => ({
        id: step.id,
        code: step.code,
        title: step.title,
        body: step.body,
        mode: step.mode,
      })),
    };
  };

  made = async (request: FastifyRequest<{ Body: PeaceMadeBody }>, reply: FastifyReply) => {
    const event = await this.peaceService.registerPeace(
      request.user.sub,
      request.body.notifyPartner,
    );

    return reply.status(201).send({
      id: event.id,
      notifiedPartner: event.notifiedPartner,
      createdAt: event.createdAt.toISOString(),
    });
  };
}
