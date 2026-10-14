import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DiaryRepository } from '../../../src/modules/diary/diary.repository.js';
import { DiaryService } from '../../../src/modules/diary/diary.service.js';
import { NotFoundError, UnprocessableEntityError } from '../../../src/shared/errors/index.js';

const TODAY = '2026-03-14';
const userId = 'user-1';
const input = { note: 'Dia ótimo', starred: true, mood: 'HAPPY' as const, togetherMoment: true };

describe('DiaryService', () => {
  let repository: DiaryRepository;
  let service: DiaryService;

  beforeEach(() => {
    repository = {
      listByYear: vi.fn().mockResolvedValue([]),
      upsert: vi.fn(),
      delete: vi.fn(),
    };
    service = new DiaryService(repository, () => TODAY);
  });

  describe('upsert', () => {
    it('saves an entry for today', async () => {
      await service.upsert(userId, TODAY, input);

      expect(repository.upsert).toHaveBeenCalledWith(userId, TODAY, {
        note: 'Dia ótimo',
        starred: true,
        mood: 'HAPPY',
        togetherMoment: true,
      });
    });

    it('saves an entry for a past date', async () => {
      await service.upsert(userId, '2026-01-01', input);

      expect(repository.upsert).toHaveBeenCalledOnce();
    });

    it('rejects future dates', async () => {
      const attempt = service.upsert(userId, '2026-03-15', input);

      await expect(attempt).rejects.toBeInstanceOf(UnprocessableEntityError);
      await expect(attempt).rejects.toMatchObject({ code: 'FUTURE_DATE' });
      expect(repository.upsert).not.toHaveBeenCalled();
    });

    it('applies defaults for fields that were not sent', async () => {
      await service.upsert(userId, TODAY, { starred: false, togetherMoment: false });

      expect(repository.upsert).toHaveBeenCalledWith(userId, TODAY, {
        note: null,
        starred: false,
        mood: null,
        togetherMoment: false,
      });
    });

    it('stores an empty note as null', async () => {
      await service.upsert(userId, TODAY, { ...input, note: '' });

      expect(repository.upsert).toHaveBeenCalledWith(
        userId,
        TODAY,
        expect.objectContaining({ note: null }),
      );
    });
  });

  describe('list', () => {
    it('uses the current year when none is given', async () => {
      const result = await service.list(userId);

      expect(repository.listByYear).toHaveBeenCalledWith(userId, 2026);
      expect(result.year).toBe(2026);
    });

    it('lists only the requested year of the given user', async () => {
      await service.list(userId, 2024);

      expect(repository.listByYear).toHaveBeenCalledWith(userId, 2024);
    });
  });

  describe('delete', () => {
    it('removes the entry of the user', async () => {
      vi.mocked(repository.delete).mockResolvedValue(true);

      await service.delete(userId, TODAY);

      expect(repository.delete).toHaveBeenCalledWith(userId, TODAY);
    });

    it('throws NotFoundError when there is no entry for that user and date', async () => {
      vi.mocked(repository.delete).mockResolvedValue(false);

      await expect(service.delete('other-user', TODAY)).rejects.toBeInstanceOf(NotFoundError);
    });
  });
});
