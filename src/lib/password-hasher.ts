import argon2 from 'argon2';

export interface PasswordHasher {
  hash(password: string): Promise<string>;
  verify(hash: string, password: string): Promise<boolean>;
}

export class Argon2PasswordHasher implements PasswordHasher {
  hash(password: string) {
    return argon2.hash(password);
  }

  verify(hash: string, password: string) {
    return argon2.verify(hash, password);
  }
}
