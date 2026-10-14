import type { FastifyRequest } from 'fastify';
import { toSettingsResponse } from './settings.mapper.js';
import type { UpdateSettingsInput } from './settings.schema.js';
import type { SettingsService } from './settings.service.js';

export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  get = async (request: FastifyRequest) => {
    const user = await this.settingsService.get(request.user.sub);

    return toSettingsResponse(user);
  };

  update = async (request: FastifyRequest<{ Body: UpdateSettingsInput }>) => {
    const user = await this.settingsService.update(request.user.sub, request.body);

    return toSettingsResponse(user);
  };
}
