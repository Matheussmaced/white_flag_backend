import { randomInt } from 'node:crypto';

const PREFIX = 'PAZ';
const SUFFIX_LENGTH = 6;
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export const generatePairCode = () => {
  const suffix = Array.from({ length: SUFFIX_LENGTH }, () =>
    ALPHABET.charAt(randomInt(ALPHABET.length)),
  ).join('');

  return `${PREFIX}-${suffix}`;
};
