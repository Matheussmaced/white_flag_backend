import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnprocessableEntityError,
} from '../../shared/errors/index.js';
import type { CatalogsService } from '../catalogs/catalogs.service.js';
import type { CouplesService } from '../couples/couples.service.js';
import type { FlagDetails, FlagsRepository } from '../flags/flags.repository.js';
import type { NotificationsService } from '../notifications/notifications.service.js';
import type { FlagRepliesRepository } from './flag-replies.repository.js';
import type { ReplyFlagBody } from './flag-replies.schema.js';

const alreadyReplied = () =>
  new ConflictError('Esta bandeira já foi respondida', 'FLAG_ALREADY_REPLIED');

export class FlagRepliesService {
  constructor(
    private readonly flagRepliesRepository: FlagRepliesRepository,
    private readonly flagsRepository: FlagsRepository,
    private readonly couplesService: CouplesService,
    private readonly catalogsService: CatalogsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async reply(userId: string, flagId: string, input: ReplyFlagBody): Promise<FlagDetails> {
    const couple = await this.couplesService.requireActiveCouple(userId);
    const flag = await this.flagsRepository.findByIdInCouple(flagId, couple.id);

    if (!flag) throw new NotFoundError('Bandeira não encontrada');

    this.assertCanReply(flag, userId);
    await this.assertCatalogChoice(flag, input);

    const created = await this.flagRepliesRepository.create({
      flagId: flag.id,
      responderId: userId,
      type: input.type,
      ...(input.type === 'DECLINE'
        ? { declineReasonId: input.declineReasonId }
        : { acceptNoteId: input.acceptNoteId }),
    });

    if (!created) throw alreadyReplied();

    const responder = couple.members.find((member) => member.userId === userId)?.user;
    const sender = couple.members.find((member) => member.userId === flag.senderId)?.user;

    if (responder && sender) {
      void this.notificationsService.notifyFlagReplied({
        receiverId: sender.id,
        hideText: sender.hideNotificationText,
        responderName: responder.name,
        accepted: input.type === 'ACCEPT',
        flagId: flag.id,
      });
    }

    const updated = await this.flagsRepository.findByIdInCouple(flag.id, couple.id);

    if (!updated) throw new NotFoundError('Bandeira não encontrada');

    return updated;
  }

  private assertCanReply(flag: FlagDetails, userId: string) {
    if (flag.receiverId !== userId) {
      throw new ForbiddenError(
        'Apenas quem recebeu a bandeira pode respondê-la',
        'NOT_FLAG_RECEIVER',
      );
    }

    if (flag.feeling.mode !== 'HOT') {
      throw new UnprocessableEntityError(
        'Apenas bandeiras do modo hot podem ser respondidas',
        'FLAG_NOT_REPLYABLE',
      );
    }

    if (flag.reply) throw alreadyReplied();
  }

  private async assertCatalogChoice(flag: FlagDetails, input: ReplyFlagBody) {
    if (input.type === 'DECLINE') {
      const reason = await this.catalogsService.getDeclineReason(input.declineReasonId);

      this.assertSameMode(reason.mode, flag);
    } else if (input.acceptNoteId) {
      const note = await this.catalogsService.getAcceptNote(input.acceptNoteId);

      this.assertSameMode(note.mode, flag);
    }
  }

  private assertSameMode(mode: string, flag: FlagDetails) {
    if (mode !== flag.feeling.mode) {
      throw new UnprocessableEntityError(
        'A opção escolhida não pertence ao modo desta bandeira',
        'CATALOG_MODE_MISMATCH',
      );
    }
  }
}
