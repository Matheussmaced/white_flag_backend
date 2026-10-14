import type { FastifyRequest } from 'fastify';
import { toFeelingResponse } from './feelings.mapper.js';
import type { ListFeelingsQuery } from './feelings.schema.js';
import type { FeelingsService } from './feelings.service.js';

export class FeelingsController {
  constructor(private readonly feelingsService: FeelingsService) {}

  list = async (request: FastifyRequest<{ Querystring: ListFeelingsQuery }>) => {
    const feelings = await this.feelingsService.list(request.query.mode);

    return { items: feelings.map(toFeelingResponse) };
  };
}
