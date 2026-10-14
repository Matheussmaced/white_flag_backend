import type { DevicesRepository } from './devices.repository.js';
import type { RegisterDeviceInput } from './devices.schema.js';

export class DevicesService {
  constructor(private readonly devicesRepository: DevicesRepository) {}

  register(userId: string, input: RegisterDeviceInput): Promise<void> {
    return this.devicesRepository.upsertByToken(userId, input.token, input.platform);
  }
}
