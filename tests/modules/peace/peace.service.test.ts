import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CouplesService } from '../../../src/modules/couples/couples.service.js';
import type { NotificationsService } from '../../../src/modules/notifications/notifications.service.js';
import type { PeaceRepository } from '../../../src/modules/peace/peace.repository.js';
import { PeaceService } from '../../../src/modules/peace/peace.service.js';
import { ForbiddenError } from '../../../src/shared/errors/index.js';
import { makeCouple, makeUser } from '../../helpers/factories.js';

const me = makeUser();
const partner = makeUser({
  id: 'b2c3d4e5-0000-4000-8000-000000000009',
  name: 'Leo Silva',
  hideNotificationText: true,
});
const event = {
  id: 'event-1',
  coupleId: 'couple-1',
  userId: me.id,
  notifiedPartner: true,
  createdAt: new Date(),
};

describe('PeaceService', () => {
  let repository: PeaceRepository;
  let couplesService: { requireActiveCouple: ReturnType<typeof vi.fn> };
  let notifications: { notifyPeaceMade: ReturnType<typeof vi.fn> };
  let service: PeaceService;

  beforeEach(() => {
    repository = {
      listRules: vi.fn().mockResolvedValue([]),
      listContents: vi.fn().mockResolvedValue([]),
      createEvent: vi.fn().mockResolvedValue(event),
    };
    couplesService = { requireActiveCouple: vi.fn().mockResolvedValue(makeCouple(me, partner)) };
    notifications = { notifyPeaceMade: vi.fn().mockResolvedValue(undefined) };
    service = new PeaceService(
      repository,
      couplesService as unknown as CouplesService,
      notifications as unknown as NotificationsService,
    );
  });

  it('registers the event and notifies the partner when requested', async () => {
    await service.registerPeace(me.id, true);

    expect(repository.createEvent).toHaveBeenCalledWith(
      expect.objectContaining({ userId: me.id, notifiedPartner: true }),
    );
    expect(notifications.notifyPeaceMade).toHaveBeenCalledWith(
      expect.objectContaining({ receiverId: partner.id, hideText: true, senderName: me.name }),
    );
  });

  it('does not notify the partner by default', async () => {
    await service.registerPeace(me.id, false);

    expect(repository.createEvent).toHaveBeenCalledWith(
      expect.objectContaining({ notifiedPartner: false }),
    );
    expect(notifications.notifyPeaceMade).not.toHaveBeenCalled();
  });

  it('requires an active couple', async () => {
    couplesService.requireActiveCouple.mockRejectedValue(
      new ForbiddenError('sem casal', 'COUPLE_REQUIRED'),
    );

    await expect(service.registerPeace(me.id, true)).rejects.toMatchObject({
      code: 'COUPLE_REQUIRED',
    });
    expect(repository.createEvent).not.toHaveBeenCalled();
  });

  it('returns rules and steps filtered by mode', async () => {
    await service.getPath('HOT');

    expect(repository.listRules).toHaveBeenCalledWith('HOT');
    expect(repository.listContents).toHaveBeenCalledWith('HOT');
  });
});
