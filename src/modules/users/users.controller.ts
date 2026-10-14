import type { FastifyRequest } from 'fastify';
import { toUserResponse } from './users.mapper.js';
import type { UsersService } from './users.service.js';

export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  me = async (request: FastifyRequest) => {
    const user = await this.usersService.getById(request.user.sub);

    return toUserResponse(user);
  };
}
