import { createHash, randomBytes } from 'node:crypto';

/** Token opaco com 256 bits de entropia, em base64url (43 caracteres). */
export function generateToken(): string {
  return randomBytes(32).toString('base64url');
}

/** Hash SHA-256 do token; basta para segredos de alta entropia e e o unico valor guardado no banco. */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export const TOKEN_FORMAT = /^[A-Za-z0-9_-]{43}$/;
