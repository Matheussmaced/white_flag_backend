import type { FastifyReply, FastifyRequest } from 'fastify';
import type { DeleteAccountInput } from './account.schema.js';
import type { AccountService } from './account.service.js';

export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  delete = async (request: FastifyRequest<{ Body: DeleteAccountInput }>, reply: FastifyReply) => {
    await this.accountService.deleteAccount(request.user.sub, request.body.password);

    return reply.status(204).send();
  };
}
