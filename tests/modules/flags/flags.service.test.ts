import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CouplesService } from '../../../src/modules/couples/couples.service.js';
import type { FeelingsService } from '../../../src/modules/feelings/feelings.service.js';
import type { FlagsRepository } from '../../../src/modules/flags/flags.repository.js';
import { FlagsService } from '../../../src/modules/flags/flags.service.js';
import type { NotificationsService } from '../../../src/modules/notifications/notifications.service.js';
import { ConflictError, ForbiddenError, NotFoundError } from '../../../src/shared/errors/index.js';
import { makeCouple, makeFeeling, makeFlag, makeUser } from '../../helpers/factories.js';

const sender = makeUser();
const receiver = makeUser({
  id: 'b2c3d4e5-0000-4000-8000-000000000009',
  name: 'Leo Silva',
  pairCode: 'PAZ-3HQ8WN',
});
const feeling = makeFeeling();
const input = { feelingId: feeling.id, idempotencyKey: 'key-1234567890' };

describe('FlagsService', () => {
  let repository: FlagsRepository;
  let couplesService: { requireActiveCouple: ReturnType<typeof vi.fn> };
  let feelingsService: { getActiveById: ReturnType<typeof vi.fn> };
  let notifications: { notifyFlagReceived: ReturnType<typeof vi.fn> };
  let service: FlagsService;

  beforeEach(() => {
    repository = {
      findByIdempotencyKey: vi.fn().mockResolvedValue(null),
      findByIdInCouple: vi.fn(),
      create: vi.fn().mockResolvedValue(makeFlag()),
      list: vi.fn(),
      markSeen: vi.fn(),
    };
    couplesService = {
      requireActiveCouple: vi.fn().mockResolvedValue(makeCouple(sender, receiver)),
    };
    feelingsService = { getActiveById: vi.fn().mockResolvedValue(feeling) };
    notifications = { notifyFlagReceived: vi.fn().mockResolvedValue(undefined) };
    service = new FlagsService(
      repository,
      couplesService as unknown as CouplesService,
      feelingsService as unknown as FeelingsService,
      notifications as unknown as NotificationsService,
    );
  });

  describe('send', () => {
    it('creates the flag for the partner and notifies them', async () => {
      const result = await service.send(sender.id, input);

      expect(result.created).toBe(true);
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ senderId: sender.id, receiverId: receiver.id }),
      );
      expect(notifications.notifyFlagReceived).toHaveBeenCalledWith(
        expect.objectContaining({
          receiverId: receiver.id,
          senderName: sender.name,
          feelingLabel: feeling.label,
          hideText: false,
        }),
      );
    });

    it('forwards the receiver preference to hide the notification text', async () => {
      couplesService.requireActiveCouple.mockResolvedValue(
        makeCouple(sender, { ...receiver, hideNotificationText: true }),
      );

      await service.send(sender.id, input);

      expect(notifications.notifyFlagReceived).toHaveBeenCalledWith(
        expect.objectContaining({ hideText: true }),
      );
    });

    it('returns the original flag without notifying when the key was already used', async () => {
      const existing = makeFlag();
      vi.mocked(repository.findByIdempotencyKey).mockResolvedValue(existing);

      const result = await service.send(sender.id, input);

      expect(result).toEqual({ flag: existing, created: false });
      expect(repository.create).not.toHaveBeenCalled();
      expect(notifications.notifyFlagReceived).not.toHaveBeenCalled();
    });

    it('rejects a reused key with a different feeling', async () => {
      vi.mocked(repository.findByIdempotencyKey).mockResolvedValue(
        makeFlag({ feelingId: 'another-feeling' }),
      );

      await expect(service.send(sender.id, input)).rejects.toMatchObject({
        code: 'IDEMPOTENCY_KEY_REUSED',
      });
    });

    it('resolves a concurrent duplicate as a replay', async () => {
      const existing = makeFlag();
      vi.mocked(repository.findByIdempotencyKey)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(existing);
      vi.mocked(repository.create).mockResolvedValue(null);

      const result = await service.send(sender.id, input);

      expect(result).toEqual({ flag: existing, created: false });
      expect(notifications.notifyFlagReceived).not.toHaveBeenCalled();
    });

    it('blocks hot feelings when the sender has hot mode disabled', async () => {
      feelingsService.getActiveById.mockResolvedValue(makeFeeling({ mode: 'HOT' }));
      couplesService.requireActiveCouple.mockResolvedValue(
        makeCouple({ ...sender, hotModeEnabled: false }, receiver),
      );

      await expect(service.send(sender.id, input)).rejects.toMatchObject({
        code: 'HOT_MODE_DISABLED',
      });
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('allows hot feelings when the sender enabled hot mode', async () => {
      feelingsService.getActiveById.mockResolvedValue(makeFeeling({ mode: 'HOT' }));

      await expect(service.send(sender.id, input)).resolves.toMatchObject({ created: true });
    });

    it('requires an active couple', async () => {
      couplesService.requireActiveCouple.mockRejectedValue(
        new ForbiddenError('sem casal', 'COUPLE_REQUIRED'),
      );

      await expect(service.send(sender.id, input)).rejects.toMatchObject({
        code: 'COUPLE_REQUIRED',
      });
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('rejects an unknown feeling', async () => {
      feelingsService.getActiveById.mockRejectedValue(
        new NotFoundError('Sentimento não encontrado'),
      );

      await expect(service.send(sender.id, input)).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe('markSeen', () => {
    it('marks a received flag as seen', async () => {
      const flag = makeFlag({ senderId: sender.id, receiverId: receiver.id });
      const seen = makeFlag({ seenAt: new Date() });
      vi.mocked(repository.findByIdInCouple).mockResolvedValue(flag);
      vi.mocked(repository.markSeen).mockResolvedValue(seen);

      await expect(service.markSeen(receiver.id, flag.id)).resolves.toBe(seen);
    });

    it('keeps the first seen date when called again', async () => {
      const flag = makeFlag({ receiverId: receiver.id, seenAt: new Date('2026-01-04') });
      vi.mocked(repository.findByIdInCouple).mockResolvedValue(flag);

      await expect(service.markSeen(receiver.id, flag.id)).resolves.toBe(flag);
      expect(repository.markSeen).not.toHaveBeenCalled();
    });

    it('forbids the sender from marking the flag as seen', async () => {
      const flag = makeFlag({ senderId: sender.id, receiverId: receiver.id });
      vi.mocked(repository.findByIdInCouple).mockResolvedValue(flag);

      const attempt = service.markSeen(sender.id, flag.id);

      await expect(attempt).rejects.toBeInstanceOf(ForbiddenError);
      await expect(attempt).rejects.toMatchObject({ code: 'NOT_FLAG_RECEIVER' });
    });

    it('returns not found for flags outside the couple', async () => {
      vi.mocked(repository.findByIdInCouple).mockResolvedValue(null);

      await expect(service.markSeen(receiver.id, 'x')).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe('conflict handling', () => {
    it('surfaces a conflict when the duplicate cannot be found again', async () => {
      vi.mocked(repository.create).mockResolvedValue(null);

      await expect(service.send(sender.id, input)).rejects.toBeInstanceOf(ConflictError);
    });
  });
});
