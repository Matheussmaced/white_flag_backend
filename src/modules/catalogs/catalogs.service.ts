import type { AcceptNote, ContentMode, DeclineReason, DiceChallenge } from '@prisma/client';
import { NotFoundError } from '../../shared/errors/index.js';
import type { CatalogsRepository } from './catalogs.repository.js';

export class CatalogsService {
  constructor(private readonly catalogsRepository: CatalogsRepository) {}

  listDeclineReasons(mode?: ContentMode): Promise<DeclineReason[]> {
    return this.catalogsRepository.listDeclineReasons(mode);
  }

  listAcceptNotes(mode?: ContentMode): Promise<AcceptNote[]> {
    return this.catalogsRepository.listAcceptNotes(mode);
  }

  listDiceChallenges(mode?: ContentMode): Promise<DiceChallenge[]> {
    return this.catalogsRepository.listDiceChallenges(mode);
  }

  async getDeclineReason(id: string): Promise<DeclineReason> {
    const reason = await this.catalogsRepository.findDeclineReasonById(id);

    if (!reason) throw new NotFoundError('Motivo de recusa não encontrado');

    return reason;
  }

  async getAcceptNote(id: string): Promise<AcceptNote> {
    const note = await this.catalogsRepository.findAcceptNoteById(id);

    if (!note) throw new NotFoundError('Frase de aceite não encontrada');

    return note;
  }
}
