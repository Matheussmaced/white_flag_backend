import { createHash, randomBytes } from 'node:crypto';

const OPAQUE_TOKEN_BYTES = 32;

export const generateOpaqueToken = () => randomBytes(OPAQUE_TOKEN_BYTES).toString('base64url');

export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');
