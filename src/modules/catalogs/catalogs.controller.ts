import type { FastifyRequest } from 'fastify';
import { toCatalogItemResponse } from './catalogs.mapper.js';
import type { ListCatalogQuery } from './catalogs.schema.js';
import type { CatalogsService } from './catalogs.service.js';

type CatalogRequest = FastifyRequest<{ Querystring: ListCatalogQuery }>;

export class CatalogsController {
  constructor(private readonly catalogsService: CatalogsService) {}

  declineReasons = async (request: CatalogRequest) => {
    const items = await this.catalogsService.listDeclineReasons(request.query.mode);

    return { items: items.map(toCatalogItemResponse) };
  };

  acceptNotes = async (request: CatalogRequest) => {
    const items = await this.catalogsService.listAcceptNotes(request.query.mode);

    return { items: items.map(toCatalogItemResponse) };
  };

  diceChallenges = async (request: CatalogRequest) => {
    const items = await this.catalogsService.listDiceChallenges(request.query.mode);

    return { items: items.map(toCatalogItemResponse) };
  };
}
