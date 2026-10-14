import { ConflictError, ForbiddenError, NotFoundError } from '../../shared/errors/index.js';
import type { PaginatedResult } from '../../shared/http/pagination.js';
import type { CouplesService } from '../couples/couples.service.js';
import type { FeelingsService } from '../feelings/feelings.service.js';
import type { NotificationsService } from '../notifications/notifications.service.js';
import type { FlagDetails, FlagsRepository } from './flags.repository.js';
import type { FlagDirection } from './flags.schema.js';

export interface SendFlagInput {
  feelingId: string;
  idempotencyKey: string;
}

export interface SendFlagResult {
  flag: FlagDetails;
  created: boolean;
}

export interface ListFlagsInput {
  direction?: FlagDirection;
  page: number;
  perPage: number;
}

export class FlagsService {
  constructor(
    private readonly flagsRepository: FlagsRepository,
    private readonly couplesService: CouplesService,
    private readonly feelingsService: FeelingsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async send(userId: string, input: SendFlagInput): Promise<SendFlagResult> {
    const couple = await this.couplesService.requireActiveCouple(userId);
    const feeling = await this.feelingsService.getActiveById(input.feelingId);

    const existing = await this.flagsRepository.findByIdempotencyKey(userId, input.idempotencyKey);

    if (existing) return { flag: this.ensureSameRequest(existing, feeling.id), created: false };

    const sender = couple.members.find((member) => member.userId === userId)?.user;
    const receiver = couple.members.find((member) => member.userId !== userId)?.user;

    if (!sender || !receiver) throw new NotFoundError('Par não encontrado');

    if (feeling.mode === 'HOT' && !sender.hotModeEnabled) {
      throw new ForbiddenError(
        'Ative o modo hot nos ajustes para enviar este tipo de bandeira',
        'HOT_MODE_DISABLED',
      );
    }

    const flag = await this.flagsRepository.create({
      coupleId: couple.id,
      senderId: sender.id,
      receiverId: receiver.id,
      feelingId: feeling.id,
      idempotencyKey: input.idempotencyKey,
    });

    if (!flag) {
      const concurrent = await this.flagsRepository.findByIdempotencyKey(
        userId,
        input.idempotencyKey,
      );

      if (!concurrent)
        throw new ConflictError('Não foi possível registrar a bandeira. Tente novamente.');

      return { flag: this.ensureSameRequest(concurrent, feeling.id), created: false };
    }

    void this.notificationsService.notifyFlagReceived({
      receiverId: receiver.id,
      hideText: receiver.hideNotificationText,
      senderName: sender.name,
      feelingLabel: feeling.label,
      flagId: flag.id,
    });

    return { flag, created: true };
  }

  async list(userId: string, input: ListFlagsInput): Promise<PaginatedResult<FlagDetails>> {
    const couple = await this.couplesService.requireActiveCouple(userId);

    return this.flagsRepository.list({ ...input, coupleId: couple.id, userId });
  }

  async markSeen(userId: string, flagId: string): Promise<FlagDetails> {
    const couple = await this.couplesService.requireActiveCouple(userId);
    const flag = await this.flagsRepository.findByIdInCouple(flagId, couple.id);

    if (!flag) throw new NotFoundError('Bandeira não encontrada');

    if (flag.receiverId !== userId) {
      throw new ForbiddenError(
        'Apenas quem recebeu a bandeira pode marcá-la como vista',
        'NOT_FLAG_RECEIVER',
      );
    }

    if (flag.seenAt) return flag;

    return this.flagsRepository.markSeen(flag.id);
  }

  private ensureSameRequest(flag: FlagDetails, feelingId: string): FlagDetails {
    if (flag.feelingId !== feelingId) {
      throw new ConflictError(
        'Esta chave de idempotência já foi usada com outro sentimento',
        'IDEMPOTENCY_KEY_REUSED',
      );
    }

    return flag;
  }
}
