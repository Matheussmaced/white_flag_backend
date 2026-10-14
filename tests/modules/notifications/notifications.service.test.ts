import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PushSender } from '../../../src/lib/push-sender.js';
import type { DevicesRepository } from '../../../src/modules/devices/devices.repository.js';
import {
  NotificationsService,
  type NotificationLogger,
} from '../../../src/modules/notifications/notifications.service.js';

const notification = {
  receiverId: 'receiver-1',
  hideText: false,
  senderName: 'Maria',
  feelingLabel: 'Estou com saudade',
  flagId: 'flag-1',
};

describe('NotificationsService', () => {
  let devices: DevicesRepository;
  let pushSender: PushSender;
  let logError: ReturnType<typeof vi.fn<NotificationLogger['error']>>;
  let service: NotificationsService;

  beforeEach(() => {
    devices = {
      upsertByToken: vi.fn(),
      findTokensByUserId: vi.fn().mockResolvedValue(['ExponentPushToken[a]']),
      deleteByTokens: vi.fn(),
    };
    pushSender = { send: vi.fn().mockResolvedValue([]) };
    logError = vi.fn<NotificationLogger['error']>();
    service = new NotificationsService(devices, pushSender, { error: logError });
  });

  it('sends the sender name and feeling to every device of the receiver', async () => {
    vi.mocked(devices.findTokensByUserId).mockResolvedValue([
      'ExponentPushToken[a]',
      'ExponentPushToken[b]',
    ]);

    await service.notifyFlagReceived(notification);

    expect(pushSender.send).toHaveBeenCalledWith([
      expect.objectContaining({
        to: 'ExponentPushToken[a]',
        title: 'Maria',
        body: 'Estou com saudade',
      }),
      expect.objectContaining({
        to: 'ExponentPushToken[b]',
        title: 'Maria',
        body: 'Estou com saudade',
      }),
    ]);
  });

  it('hides the sender and feeling when the receiver prefers it', async () => {
    await service.notifyFlagReceived({ ...notification, hideText: true });

    const messages = vi.mocked(pushSender.send).mock.calls[0]?.[0];

    expect(messages?.[0]).toMatchObject({
      title: 'White Flag',
      body: 'Você recebeu uma nova bandeira',
    });
    expect(JSON.stringify(messages)).not.toContain('Maria');
    expect(JSON.stringify(messages)).not.toContain('saudade');
  });

  it('does nothing when the receiver has no devices', async () => {
    vi.mocked(devices.findTokensByUserId).mockResolvedValue([]);

    await service.notifyFlagReceived(notification);

    expect(pushSender.send).not.toHaveBeenCalled();
  });

  it('removes devices reported as unregistered', async () => {
    vi.mocked(pushSender.send).mockResolvedValue(['ExponentPushToken[a]']);

    await service.notifyFlagReceived(notification);

    expect(devices.deleteByTokens).toHaveBeenCalledWith(['ExponentPushToken[a]']);
  });

  it('never throws when the push provider fails', async () => {
    vi.mocked(pushSender.send).mockRejectedValue(new Error('network down'));

    await expect(service.notifyFlagReceived(notification)).resolves.toBeUndefined();
    expect(logError).toHaveBeenCalledOnce();
  });

  describe('notifyFlagReplied', () => {
    const reply = {
      receiverId: 'sender-1',
      hideText: false,
      responderName: 'Leo',
      accepted: true,
      flagId: 'flag-1',
    };

    it('tells the sender who answered and whether they accepted', async () => {
      await service.notifyFlagReplied(reply);

      expect(pushSender.send).toHaveBeenCalledWith([
        expect.objectContaining({ title: 'Leo', body: 'Topou' }),
      ]);

      await service.notifyFlagReplied({ ...reply, accepted: false });

      expect(vi.mocked(pushSender.send).mock.calls[1]?.[0][0]).toMatchObject({ body: 'Hoje não' });
    });

    it('hides the answer when the sender prefers it', async () => {
      await service.notifyFlagReplied({ ...reply, hideText: true });

      const messages = vi.mocked(pushSender.send).mock.calls[0]?.[0];

      expect(messages?.[0]).toMatchObject({
        title: 'White Flag',
        body: 'Você recebeu uma resposta',
      });
      expect(JSON.stringify(messages)).not.toContain('Leo');
      expect(JSON.stringify(messages)).not.toContain('Topou');
    });
  });

  describe('notifyPeaceMade', () => {
    const peace = {
      receiverId: 'partner-1',
      hideText: false,
      senderName: 'Ana',
      eventId: 'event-1',
    };

    it('tells the partner that peace was made', async () => {
      await service.notifyPeaceMade(peace);

      expect(pushSender.send).toHaveBeenCalledWith([
        expect.objectContaining({
          title: 'Ana',
          body: 'Fizemos as pazes',
          data: { type: 'PEACE_MADE', eventId: 'event-1' },
        }),
      ]);
    });

    it('hides the sender when the partner prefers it', async () => {
      await service.notifyPeaceMade({ ...peace, hideText: true });

      const messages = vi.mocked(pushSender.send).mock.calls[0]?.[0];

      expect(JSON.stringify(messages)).not.toContain('Ana');
      expect(messages?.[0]).toMatchObject({ title: 'White Flag' });
    });
  });
});
