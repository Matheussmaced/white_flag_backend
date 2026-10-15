import { hash, verify } from '@node-rs/argon2';

export interface PasswordHasher {
  hash(password: string): Promise<string>;
  verify(hash: string, password: string): Promise<boolean>;
}

export class Argon2PasswordHasher implements PasswordHasher {
  hash(password: string) {
    return hash(password);
  }

  verify(hashedPassword: string, password: string) {
    return verify(hashedPassword, password);
  }
}
