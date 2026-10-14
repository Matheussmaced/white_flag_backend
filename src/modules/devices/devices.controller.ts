import type { FastifyReply, FastifyRequest } from 'fastify';
import type { RegisterDeviceInput } from './devices.schema.js';
import type { DevicesService } from './devices.service.js';

export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  register = async (
    request: FastifyRequest<{ Body: RegisterDeviceInput }>,
    reply: FastifyReply,
  ) => {
    await this.devicesService.register(request.user.sub, request.body);

    return reply.status(204).send();
  };
}
