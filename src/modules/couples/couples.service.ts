import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnprocessableEntityError,
} from '../../shared/errors/index.js';
import type { UsersService } from '../users/users.service.js';
import type { CoupleWithMembers, CouplesRepository } from './couples.repository.js';

export class CouplesService {
  constructor(
    private readonly couplesRepository: CouplesRepository,
    private readonly usersService: UsersService,
  ) {}

  async join(userId: string, pairCode: string): Promise<CoupleWithMembers> {
    const user = await this.usersService.getById(userId);

    if (pairCode === user.pairCode) {
      throw new UnprocessableEntityError(
        'Você não pode usar o seu próprio código de pareamento',
        'OWN_PAIR_CODE',
      );
    }

    const partner = await this.usersService.findByPairCode(pairCode);

    if (!partner) throw new NotFoundError('Código de pareamento não encontrado');

    if (await this.couplesRepository.findActiveByUserId(user.id)) {
      throw new ConflictError('Você já faz parte de um casal', 'ALREADY_PAIRED');
    }

    if (await this.couplesRepository.findActiveByUserId(partner.id)) {
      throw new ConflictError('Esta pessoa já faz parte de um casal', 'PARTNER_ALREADY_PAIRED');
    }

    return this.couplesRepository.createWithMembers([user.id, partner.id]);
  }

  async getCouple(userId: string): Promise<CoupleWithMembers> {
    const couple = await this.couplesRepository.findActiveByUserId(userId);

    if (!couple) throw new NotFoundError('Casal não encontrado');

    return couple;
  }

  async requireActiveCouple(userId: string): Promise<CoupleWithMembers> {
    const couple = await this.couplesRepository.findActiveByUserId(userId);

    if (!couple)
      throw new ForbiddenError(
        'É necessário ter um casal ativo para realizar esta ação',
        'COUPLE_REQUIRED',
      );

    return couple;
  }

  async disconnect(userId: string): Promise<void> {
    const couple = await this.getCouple(userId);

    await this.couplesRepository.end(couple.id);
  }
}
