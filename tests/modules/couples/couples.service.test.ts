import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CouplesRepository } from '../../../src/modules/couples/couples.repository.js';
import { CouplesService } from '../../../src/modules/couples/couples.service.js';
import type { UsersService } from '../../../src/modules/users/users.service.js';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnprocessableEntityError,
} from '../../../src/shared/errors/index.js';
import { makeCouple, makeUser } from '../../helpers/factories.js';

const me = makeUser();
const partner = makeUser({ id: 'b2c3d4e5-0000-4000-8000-000000000009', pairCode: 'PAZ-3HQ8WN' });

describe('CouplesService', () => {
  let repository: CouplesRepository;
  let usersService: { getById: ReturnType<typeof vi.fn>; findByPairCode: ReturnType<typeof vi.fn> };
  let service: CouplesService;

  beforeEach(() => {
    repository = {
      findActiveByUserId: vi.fn().mockResolvedValue(null),
      createWithMembers: vi.fn(),
      end: vi.fn(),
    };
    usersService = {
      getById: vi.fn().mockResolvedValue(me),
      findByPairCode: vi.fn().mockResolvedValue(partner),
    };
    service = new CouplesService(repository, usersService as unknown as UsersService);
  });

  describe('join', () => {
    it('creates a couple with both users', async () => {
      const couple = makeCouple(me, partner);
      vi.mocked(repository.createWithMembers).mockResolvedValue(couple);

      const result = await service.join(me.id, partner.pairCode);

      expect(repository.createWithMembers).toHaveBeenCalledWith([me.id, partner.id]);
      expect(result).toBe(couple);
    });

    it('rejects the own pair code', async () => {
      await expect(service.join(me.id, me.pairCode)).rejects.toBeInstanceOf(
        UnprocessableEntityError,
      );
      expect(repository.createWithMembers).not.toHaveBeenCalled();
    });

    it('rejects an unknown pair code', async () => {
      usersService.findByPairCode.mockResolvedValue(null);

      await expect(service.join(me.id, 'PAZ-AAAAAA')).rejects.toBeInstanceOf(NotFoundError);
    });

    it('rejects when the user is already in a couple', async () => {
      vi.mocked(repository.findActiveByUserId).mockResolvedValueOnce(makeCouple());

      await expect(service.join(me.id, partner.pairCode)).rejects.toMatchObject({
        code: 'ALREADY_PAIRED',
      });
    });

    it('rejects when the partner is already in a couple', async () => {
      vi.mocked(repository.findActiveByUserId)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(makeCouple());

      const attempt = service.join(me.id, partner.pairCode);

      await expect(attempt).rejects.toBeInstanceOf(ConflictError);
      await expect(attempt).rejects.toMatchObject({ code: 'PARTNER_ALREADY_PAIRED' });
      expect(repository.createWithMembers).not.toHaveBeenCalled();
    });
  });

  describe('getCouple', () => {
    it('throws NotFoundError without an active couple', async () => {
      await expect(service.getCouple(me.id)).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe('requireActiveCouple', () => {
    it('returns the active couple', async () => {
      const couple = makeCouple();
      vi.mocked(repository.findActiveByUserId).mockResolvedValue(couple);

      await expect(service.requireActiveCouple(me.id)).resolves.toBe(couple);
    });

    it('throws ForbiddenError without an active couple', async () => {
      await expect(service.requireActiveCouple(me.id)).rejects.toBeInstanceOf(ForbiddenError);
    });
  });

  describe('disconnect', () => {
    it('ends the active couple', async () => {
      const couple = makeCouple();
      vi.mocked(repository.findActiveByUserId).mockResolvedValue(couple);

      await service.disconnect(me.id);

      expect(repository.end).toHaveBeenCalledWith(couple.id);
    });

    it('throws NotFoundError without an active couple', async () => {
      await expect(service.disconnect(me.id)).rejects.toBeInstanceOf(NotFoundError);
      expect(repository.end).not.toHaveBeenCalled();
    });
  });
});
