import type { AcceptNote, DeclineReason } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CatalogsService } from '../../../src/modules/catalogs/catalogs.service.js';
import type { CouplesService } from '../../../src/modules/couples/couples.service.js';
import type { FlagRepliesRepository } from '../../../src/modules/flag-replies/flag-replies.repository.js';
import { FlagRepliesService } from '../../../src/modules/flag-replies/flag-replies.service.js';
import type { FlagsRepository } from '../../../src/modules/flags/flags.repository.js';
import type { NotificationsService } from '../../../src/modules/notifications/notifications.service.js';
import { NotFoundError } from '../../../src/shared/errors/index.js';
import { makeCouple, makeFeeling, makeFlag, makeUser } from '../../helpers/factories.js';

const sender = makeUser();
const receiver = makeUser({
  id: 'b2c3d4e5-0000-4000-8000-000000000009',
  name: 'Leo Silva',
  pairCode: 'PAZ-3HQ8WN',
});
const hotFlag = makeFlag({
  senderId: sender.id,
  receiverId: receiver.id,
  feeling: makeFeeling({ mode: 'HOT' }),
});
const reason = { id: 'reason-1', code: 'cansaco', label: 'Cansaço', mode: 'HOT' } as DeclineReason;
const note = { id: 'note-1', code: 'topo', label: 'Topo', mode: 'HOT' } as AcceptNote;

describe('FlagRepliesService', () => {
  let repository: FlagRepliesRepository;
  let flagsRepository: { findByIdInCouple: ReturnType<typeof vi.fn> };
  let couplesService: { requireActiveCouple: ReturnType<typeof vi.fn> };
  let catalogs: {
    getDeclineReason: ReturnType<typeof vi.fn>;
    getAcceptNote: ReturnType<typeof vi.fn>;
  };
  let notifications: { notifyFlagReplied: ReturnType<typeof vi.fn> };
  let service: FlagRepliesService;

  beforeEach(() => {
    repository = { create: vi.fn().mockResolvedValue(true) };
    flagsRepository = { findByIdInCouple: vi.fn().mockResolvedValue(hotFlag) };
    couplesService = {
      requireActiveCouple: vi.fn().mockResolvedValue(makeCouple(sender, receiver)),
    };
    catalogs = {
      getDeclineReason: vi.fn().mockResolvedValue(reason),
      getAcceptNote: vi.fn().mockResolvedValue(note),
    };
    notifications = { notifyFlagReplied: vi.fn().mockResolvedValue(undefined) };
    service = new FlagRepliesService(
      repository,
      flagsRepository as unknown as FlagsRepository,
      couplesService as unknown as CouplesService,
      catalogs as unknown as CatalogsService,
      notifications as unknown as NotificationsService,
    );
  });

  it('registers a decline with the reason and notifies the sender', async () => {
    await service.reply(receiver.id, hotFlag.id, { type: 'DECLINE', declineReasonId: reason.id });

    expect(repository.create).toHaveBeenCalledWith({
      flagId: hotFlag.id,
      responderId: receiver.id,
      type: 'DECLINE',
      declineReasonId: reason.id,
    });
    expect(notifications.notifyFlagReplied).toHaveBeenCalledWith(
      expect.objectContaining({
        receiverId: sender.id,
        responderName: receiver.name,
        accepted: false,
      }),
    );
  });

  it('registers an accept with an optional note', async () => {
    await service.reply(receiver.id, hotFlag.id, { type: 'ACCEPT', acceptNoteId: note.id });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'ACCEPT', acceptNoteId: note.id }),
    );
    expect(notifications.notifyFlagReplied).toHaveBeenCalledWith(
      expect.objectContaining({ accepted: true }),
    );
  });

  it('accepts without a note', async () => {
    await service.reply(receiver.id, hotFlag.id, { type: 'ACCEPT' });

    expect(catalogs.getAcceptNote).not.toHaveBeenCalled();
    expect(repository.create).toHaveBeenCalledOnce();
  });

  it('forbids the sender from replying', async () => {
    await expect(service.reply(sender.id, hotFlag.id, { type: 'ACCEPT' })).rejects.toMatchObject({
      code: 'NOT_FLAG_RECEIVER',
    });
  });

  it('rejects replies to normal mode flags', async () => {
    flagsRepository.findByIdInCouple.mockResolvedValue(
      makeFlag({ receiverId: receiver.id, feeling: makeFeeling({ mode: 'NORMAL' }) }),
    );

    await expect(service.reply(receiver.id, hotFlag.id, { type: 'ACCEPT' })).rejects.toMatchObject({
      code: 'FLAG_NOT_REPLYABLE',
    });
  });

  it('rejects a flag that was already replied', async () => {
    flagsRepository.findByIdInCouple.mockResolvedValue({
      ...hotFlag,
      reply: { type: 'ACCEPT' },
    });

    await expect(service.reply(receiver.id, hotFlag.id, { type: 'ACCEPT' })).rejects.toMatchObject({
      code: 'FLAG_ALREADY_REPLIED',
    });
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('resolves a concurrent duplicate as already replied', async () => {
    vi.mocked(repository.create).mockResolvedValue(false);

    await expect(service.reply(receiver.id, hotFlag.id, { type: 'ACCEPT' })).rejects.toMatchObject({
      code: 'FLAG_ALREADY_REPLIED',
    });
    expect(notifications.notifyFlagReplied).not.toHaveBeenCalled();
  });

  it('rejects a catalog item from another mode', async () => {
    catalogs.getDeclineReason.mockResolvedValue({ ...reason, mode: 'NORMAL' });

    await expect(
      service.reply(receiver.id, hotFlag.id, { type: 'DECLINE', declineReasonId: reason.id }),
    ).rejects.toMatchObject({ code: 'CATALOG_MODE_MISMATCH' });
  });

  it('returns not found for flags outside the couple', async () => {
    flagsRepository.findByIdInCouple.mockResolvedValue(null);

    await expect(service.reply(receiver.id, 'x', { type: 'ACCEPT' })).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});
