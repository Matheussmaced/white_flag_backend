import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mailer } from '../../../src/lib/mailer.js';
import type { PasswordHasher } from '../../../src/lib/password-hasher.js';
import { hashToken } from '../../../src/lib/tokens.js';
import { AuthService } from '../../../src/modules/auth/auth.service.js';
import type { PasswordResetsRepository } from '../../../src/modules/auth/password-resets.repository.js';
import type { RefreshTokensRepository } from '../../../src/modules/auth/refresh-tokens.repository.js';
import type { UsersService } from '../../../src/modules/users/users.service.js';
import { UnauthorizedError, UnprocessableEntityError } from '../../../src/shared/errors/index.js';
import { makePasswordReset, makeRefreshToken, makeUser } from '../../helpers/factories.js';

const passwordHasher: PasswordHasher = {
  hash: async (password) => `hashed:${password}`,
  verify: async (hash, password) => hash === `hashed:${password}`,
};

describe('AuthService', () => {
  let usersService: { create: ReturnType<typeof vi.fn>; findByEmail: ReturnType<typeof vi.fn> };
  let refreshTokens: RefreshTokensRepository;
  let passwordResets: PasswordResetsRepository;
  let mailer: Mailer;
  let service: AuthService;

  beforeEach(() => {
    usersService = { create: vi.fn(), findByEmail: vi.fn() };
    refreshTokens = {
      create: vi.fn(),
      findByHash: vi.fn(),
      revokeIfActive: vi.fn(),
      revokeAllByUser: vi.fn(),
    };
    passwordResets = { create: vi.fn(), findByHash: vi.fn(), apply: vi.fn() };
    mailer = { sendPasswordReset: vi.fn() };
    service = new AuthService(
      usersService as unknown as UsersService,
      refreshTokens,
      passwordResets,
      passwordHasher,
      { sign: (userId) => `access:${userId}` },
      mailer,
      { accessTokenTtlSeconds: 900, refreshTokenTtlMs: 60_000, passwordResetTtlMs: 60_000 },
    );
  });

  describe('register', () => {
    it('hashes the password and returns tokens', async () => {
      const user = makeUser();
      usersService.create.mockResolvedValue(user);

      const result = await service.register({
        name: user.name,
        email: user.email,
        password: 'secret123',
      });

      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({ passwordHash: 'hashed:secret123' }),
      );
      expect(result.tokens.accessToken).toBe(`access:${user.id}`);
      expect(refreshTokens.create).toHaveBeenCalledOnce();
    });
  });

  describe('login', () => {
    it('returns tokens for valid credentials', async () => {
      usersService.findByEmail.mockResolvedValue(makeUser());

      const result = await service.login({ email: 'jane@example.com', password: 'secret123' });

      expect(result.tokens.expiresIn).toBe(900);
    });

    it('rejects a wrong password', async () => {
      usersService.findByEmail.mockResolvedValue(makeUser());

      await expect(
        service.login({ email: 'jane@example.com', password: 'wrong' }),
      ).rejects.toBeInstanceOf(UnauthorizedError);
    });

    it('rejects an unknown email with the same error', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: 'nobody@example.com', password: 'secret123' }),
      ).rejects.toThrow('E-mail ou senha inválidos');
    });
  });

  describe('refresh', () => {
    it('rotates an active token', async () => {
      vi.mocked(refreshTokens.findByHash).mockResolvedValue(makeRefreshToken());
      vi.mocked(refreshTokens.revokeIfActive).mockResolvedValue(true);

      const tokens = await service.refresh('token');

      expect(refreshTokens.findByHash).toHaveBeenCalledWith(hashToken('token'));
      expect(tokens.refreshToken).not.toBe('token');
    });

    it('rejects an unknown token', async () => {
      vi.mocked(refreshTokens.findByHash).mockResolvedValue(null);

      await expect(service.refresh('token')).rejects.toBeInstanceOf(UnauthorizedError);
    });

    it('revokes every session when a revoked token is reused', async () => {
      const stored = makeRefreshToken({ revokedAt: new Date() });
      vi.mocked(refreshTokens.findByHash).mockResolvedValue(stored);

      await expect(service.refresh('token')).rejects.toBeInstanceOf(UnauthorizedError);
      expect(refreshTokens.revokeAllByUser).toHaveBeenCalledWith(stored.userId);
    });

    it('rejects an expired token', async () => {
      vi.mocked(refreshTokens.findByHash).mockResolvedValue(
        makeRefreshToken({ expiresAt: new Date(Date.now() - 1000) }),
      );

      await expect(service.refresh('token')).rejects.toBeInstanceOf(UnauthorizedError);
    });
  });

  describe('forgotPassword', () => {
    it('sends a reset token when the account exists', async () => {
      usersService.findByEmail.mockResolvedValue(makeUser());

      await service.forgotPassword('jane@example.com');

      expect(passwordResets.create).toHaveBeenCalledOnce();
      expect(mailer.sendPasswordReset).toHaveBeenCalledOnce();
    });

    it('does nothing when the account does not exist', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await service.forgotPassword('nobody@example.com');

      expect(mailer.sendPasswordReset).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('applies the new password for a valid token', async () => {
      const stored = makePasswordReset();
      vi.mocked(passwordResets.findByHash).mockResolvedValue(stored);

      await service.resetPassword({ token: 'token', password: 'newsecret123' });

      expect(passwordResets.apply).toHaveBeenCalledWith({
        tokenId: stored.id,
        userId: stored.userId,
        passwordHash: 'hashed:newsecret123',
      });
    });

    it.each([
      ['unknown', null],
      ['used', makePasswordReset({ usedAt: new Date() })],
      ['expired', makePasswordReset({ expiresAt: new Date(Date.now() - 1000) })],
    ])('rejects a %s token', async (_label, stored) => {
      vi.mocked(passwordResets.findByHash).mockResolvedValue(stored);

      await expect(
        service.resetPassword({ token: 'token', password: 'newsecret123' }),
      ).rejects.toBeInstanceOf(UnprocessableEntityError);
      expect(passwordResets.apply).not.toHaveBeenCalled();
    });
  });
});
