import type { User } from '@prisma/client';
import type { Mailer } from '../../lib/mailer.js';
import type { PasswordHasher } from '../../lib/password-hasher.js';
import { generateOpaqueToken, hashToken } from '../../lib/tokens.js';
import { UnauthorizedError, UnprocessableEntityError } from '../../shared/errors/index.js';
import type { UsersService } from '../users/users.service.js';
import type { AuthTokens, LoginInput, RegisterInput, ResetPasswordInput } from './auth.schema.js';
import type { PasswordResetsRepository } from './password-resets.repository.js';
import type { RefreshTokensRepository } from './refresh-tokens.repository.js';

export interface AccessTokenSigner {
  sign(userId: string): string;
}

export interface AuthConfig {
  accessTokenTtlSeconds: number;
  refreshTokenTtlMs: number;
  passwordResetTtlMs: number;
}

export interface AuthResult {
  user: User;
  tokens: AuthTokens;
}

const INVALID_CREDENTIALS_MESSAGE = 'E-mail ou senha inválidos';

export class AuthService {
  private dummyHash?: Promise<string>;

  constructor(
    private readonly usersService: UsersService,
    private readonly refreshTokensRepository: RefreshTokensRepository,
    private readonly passwordResetsRepository: PasswordResetsRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly accessTokenSigner: AccessTokenSigner,
    private readonly mailer: Mailer,
    private readonly config: AuthConfig,
  ) {}

  async register(input: RegisterInput): Promise<AuthResult> {
    const passwordHash = await this.passwordHasher.hash(input.password);
    const user = await this.usersService.create({
      name: input.name,
      email: input.email,
      passwordHash,
    });

    return { user, tokens: await this.issueTokens(user.id) };
  }

  async login(input: LoginInput): Promise<AuthResult> {
    const user = await this.usersService.findByEmail(input.email);

    if (!user) {
      await this.passwordHasher.verify(await this.getDummyHash(), input.password);
      throw new UnauthorizedError(INVALID_CREDENTIALS_MESSAGE);
    }

    const validPassword = await this.passwordHasher.verify(user.passwordHash, input.password);

    if (!validPassword) throw new UnauthorizedError(INVALID_CREDENTIALS_MESSAGE);

    return { user, tokens: await this.issueTokens(user.id) };
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const stored = await this.refreshTokensRepository.findByHash(hashToken(refreshToken));

    if (!stored) throw new UnauthorizedError('Refresh token inválido');

    if (stored.revokedAt) {
      await this.refreshTokensRepository.revokeAllByUser(stored.userId);
      throw new UnauthorizedError('Refresh token já utilizado');
    }

    if (stored.expiresAt <= new Date()) throw new UnauthorizedError('Refresh token expirado');

    const revoked = await this.refreshTokensRepository.revokeIfActive(stored.id);

    if (!revoked) {
      await this.refreshTokensRepository.revokeAllByUser(stored.userId);
      throw new UnauthorizedError('Refresh token já utilizado');
    }

    return this.issueTokens(stored.userId);
  }

  async logout(refreshToken: string): Promise<void> {
    const stored = await this.refreshTokensRepository.findByHash(hashToken(refreshToken));

    if (stored) await this.refreshTokensRepository.revokeIfActive(stored.id);
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);

    if (!user) return;

    const token = generateOpaqueToken();

    await this.passwordResetsRepository.create({
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + this.config.passwordResetTtlMs),
    });
    await this.mailer.sendPasswordReset({ email: user.email, token });
  }

  async resetPassword({ token, password }: ResetPasswordInput): Promise<void> {
    const stored = await this.passwordResetsRepository.findByHash(hashToken(token));

    if (!stored || stored.usedAt || stored.expiresAt <= new Date()) {
      throw new UnprocessableEntityError(
        'Token de recuperação inválido ou expirado',
        'INVALID_RESET_TOKEN',
      );
    }

    await this.passwordResetsRepository.apply({
      tokenId: stored.id,
      userId: stored.userId,
      passwordHash: await this.passwordHasher.hash(password),
    });
  }

  private async issueTokens(userId: string): Promise<AuthTokens> {
    const refreshToken = generateOpaqueToken();

    await this.refreshTokensRepository.create({
      userId,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + this.config.refreshTokenTtlMs),
    });

    return {
      accessToken: this.accessTokenSigner.sign(userId),
      refreshToken,
      expiresIn: this.config.accessTokenTtlSeconds,
    };
  }

  private getDummyHash(): Promise<string> {
    this.dummyHash ??= this.passwordHasher.hash(generateOpaqueToken());

    return this.dummyHash;
  }
}
