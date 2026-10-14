import type { ContentMode, PeaceContent, PeaceEvent, PeaceRule } from '@prisma/client';
import type { CouplesService } from '../couples/couples.service.js';
import type { NotificationsService } from '../notifications/notifications.service.js';
import type { PeaceRepository } from './peace.repository.js';

export interface PeacePath {
  rules: PeaceRule[];
  steps: PeaceContent[];
}

export class PeaceService {
  constructor(
    private readonly peaceRepository: PeaceRepository,
    private readonly couplesService: CouplesService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getPath(mode?: ContentMode): Promise<PeacePath> {
    const [rules, steps] = await Promise.all([
      this.peaceRepository.listRules(mode),
      this.peaceRepository.listContents(mode),
    ]);

    return { rules, steps };
  }

  async registerPeace(userId: string, notifyPartner: boolean): Promise<PeaceEvent> {
    const couple = await this.couplesService.requireActiveCouple(userId);
    const event = await this.peaceRepository.createEvent({
      coupleId: couple.id,
      userId,
      notifiedPartner: notifyPartner,
    });

    if (notifyPartner) {
      const user = couple.members.find((member) => member.userId === userId)?.user;
      const partner = couple.members.find((member) => member.userId !== userId)?.user;

      if (user && partner) {
        void this.notificationsService.notifyPeaceMade({
          receiverId: partner.id,
          hideText: partner.hideNotificationText,
          senderName: user.name,
          eventId: event.id,
        });
      }
    }

    return event;
  }
}
