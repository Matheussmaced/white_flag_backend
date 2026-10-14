import type { FastifyReply, FastifyRequest } from 'fastify';
import { toDiaryEntryResponse } from './diary.mapper.js';
import type { ListDiaryQuery, UpsertDiaryInput } from './diary.schema.js';
import type { DiaryService } from './diary.service.js';

type DateParams = { date: string };

export class DiaryController {
  constructor(private readonly diaryService: DiaryService) {}

  list = async (request: FastifyRequest<{ Querystring: ListDiaryQuery }>) => {
    const { year, items } = await this.diaryService.list(request.user.sub, request.query.year);

    return { year, items: items.map(toDiaryEntryResponse) };
  };

  upsert = async (request: FastifyRequest<{ Params: DateParams; Body: UpsertDiaryInput }>) => {
    const entry = await this.diaryService.upsert(
      request.user.sub,
      request.params.date,
      request.body,
    );

    return toDiaryEntryResponse(entry);
  };

  delete = async (request: FastifyRequest<{ Params: DateParams }>, reply: FastifyReply) => {
    await this.diaryService.delete(request.user.sub, request.params.date);

    return reply.status(204).send();
  };
}
