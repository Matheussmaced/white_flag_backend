import type { FastifyReply, FastifyRequest } from 'fastify';
import { toUserResponse } from '../users/users.mapper.js';
import { toTokensResponse } from './auth.mapper.js';
import type { LoginInput, RegisterInput, ResetPasswordInput } from './auth.schema.js';
import type { AuthResult, AuthService } from './auth.service.js';

const toAuthResponse = ({ user, tokens }: AuthResult) => ({
  user: toUserResponse(user),
  tokens: toTokensResponse(tokens),
});

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  register = async (request: FastifyRequest<{ Body: RegisterInput }>, reply: FastifyReply) => {
    const result = await this.authService.register(request.body);

    return reply.status(201).send(toAuthResponse(result));
  };

  login = async (request: FastifyRequest<{ Body: LoginInput }>) => {
    const result = await this.authService.login(request.body);

    return toAuthResponse(result);
  };

  refresh = async (request: FastifyRequest<{ Body: { refreshToken: string } }>) => {
    const tokens = await this.authService.refresh(request.body.refreshToken);

    return toTokensResponse(tokens);
  };

  logout = async (
    request: FastifyRequest<{ Body: { refreshToken: string } }>,
    reply: FastifyReply,
  ) => {
    await this.authService.logout(request.body.refreshToken);

    return reply.status(204).send();
  };

  forgotPassword = async (
    request: FastifyRequest<{ Body: { email: string } }>,
    reply: FastifyReply,
  ) => {
    await this.authService.forgotPassword(request.body.email);

    return reply.status(204).send();
  };

  resetPassword = async (
    request: FastifyRequest<{ Body: ResetPasswordInput }>,
    reply: FastifyReply,
  ) => {
    await this.authService.resetPassword(request.body);

    return reply.status(204).send();
  };
}
