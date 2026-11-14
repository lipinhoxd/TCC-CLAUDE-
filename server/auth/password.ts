import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import type { ScryptParams } from './config.ts';
import { DEFAULT_SCRYPT } from './config.ts';

const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

function derive(password: string, salt: Buffer, params: ScryptParams): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(
      password.normalize('NFKC'),
      salt,
      KEY_LENGTH,
      { N: params.N, r: params.r, p: params.p, maxmem: 256 * params.N * params.r },
      (error, key) => (error ? reject(error) : resolve(key)),
    );
  });
}

/** Gera o hash no formato `scrypt$N$r$p$sal$hash` (sal aleatorio por senha; parametros dentro do hash). */
export async function hashPassword(password: string, params: ScryptParams = DEFAULT_SCRYPT): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const key = await derive(password, salt, params);
  return ['scrypt', params.N, params.r, params.p, salt.toString('base64'), key.toString('base64')].join('$');
}

function parseHash(stored: string): { params: ScryptParams; salt: Buffer; key: Buffer } | null {
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') {
    return null;
  }
  const [N, r, p] = [Number(parts[1]), Number(parts[2]), Number(parts[3])];
  const validN = Number.isInteger(N) && N >= 2 ** 4 && N <= 2 ** 20 && (N & (N - 1)) === 0;
  if (!validN || !Number.isInteger(r) || r < 1 || r > 32 || !Number.isInteger(p) || p < 1 || p > 16) {
    return null;
  }
  const salt = Buffer.from(parts[4] ?? '', 'base64');
  const key = Buffer.from(parts[5] ?? '', 'base64');
  if (salt.length === 0 || key.length !== KEY_LENGTH) {
    return null;
  }
  return { params: { N, r, p }, salt, key };
}

/** Verifica a senha em tempo constante; hash malformado resulta em false. */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parsed = parseHash(stored);
  if (parsed === null) {
    return false;
  }
  const key = await derive(password, parsed.salt, parsed.params);
  return timingSafeEqual(key, parsed.key);
}
