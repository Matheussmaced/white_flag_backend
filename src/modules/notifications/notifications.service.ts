import type { PushMessage, PushSender } from '../../lib/push-sender.js';
import type { DevicesRepository } from '../devices/devices.repository.js';

export interface NotificationLogger {
  error(context: object, message: string): void;
}

export interface FlagNotification {
  receiverId: string;
  hideText: boolean;
  senderName: string;
  feelingLabel: string;
  flagId: string;
}

export interface FlagReplyNotification {
  receiverId: string;
  hideText: boolean;
  responderName: string;
  accepted: boolean;
  flagId: string;
}

export interface PeaceMadeNotification {
  receiverId: string;
  hideText: boolean;
  senderName: string;
  eventId: string;
}

interface Delivery {
  receiverId: string;
  type: 'FLAG_RECEIVED' | 'FLAG_REPLIED' | 'PEACE_MADE';
  data: Record<string, string>;
  hideText: boolean;
  title: string;
  body: string;
  hiddenBody: string;
}

const HIDDEN_TITLE = 'White Flag';

export class NotificationsService {
  constructor(
    private readonly devicesRepository: DevicesRepository,
    private readonly pushSender: PushSender,
    private readonly logger: NotificationLogger,
  ) {}

  notifyFlagReceived(notification: FlagNotification): Promise<void> {
    return this.deliver({
      receiverId: notification.receiverId,
      data: { flagId: notification.flagId },
      type: 'FLAG_RECEIVED',
      hideText: notification.hideText,
      title: notification.senderName,
      body: notification.feelingLabel,
      hiddenBody: 'Você recebeu uma nova bandeira',
    });
  }

  notifyFlagReplied(notification: FlagReplyNotification): Promise<void> {
    return this.deliver({
      receiverId: notification.receiverId,
      data: { flagId: notification.flagId },
      type: 'FLAG_REPLIED',
      hideText: notification.hideText,
      title: notification.responderName,
      body: notification.accepted ? 'Topou' : 'Hoje não',
      hiddenBody: 'Você recebeu uma resposta',
    });
  }

  notifyPeaceMade(notification: PeaceMadeNotification): Promise<void> {
    return this.deliver({
      receiverId: notification.receiverId,
      data: { eventId: notification.eventId },
      type: 'PEACE_MADE',
      hideText: notification.hideText,
      title: notification.senderName,
      body: 'Fizemos as pazes',
      hiddenBody: 'Você recebeu uma novidade',
    });
  }

  private async deliver(delivery: Delivery): Promise<void> {
    try {
      const tokens = await this.devicesRepository.findTokensByUserId(delivery.receiverId);

      if (tokens.length === 0) return;

      const messages = tokens.map((token) => this.buildMessage(token, delivery));
      const invalidTokens = await this.pushSender.send(messages);

      if (invalidTokens.length > 0) await this.devicesRepository.deleteByTokens(invalidTokens);
    } catch (error) {
      this.logger.error(
        { err: error, type: delivery.type, ...delivery.data },
        'Failed to send push notification',
      );
    }
  }

  private buildMessage(token: string, delivery: Delivery): PushMessage {
    const data = { type: delivery.type, ...delivery.data };

    if (delivery.hideText) {
      return { to: token, title: HIDDEN_TITLE, body: delivery.hiddenBody, data };
    }

    return { to: token, title: delivery.title, body: delivery.body, data };
  }
}
