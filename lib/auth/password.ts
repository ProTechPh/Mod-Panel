import bcrypt from 'bcryptjs';
import { createHash } from 'crypto';

const LEGACY_SALT = process.env.PASSWORD_LEGACY_SALT || 'XquxmymXDtWRA66D';
const BCRYPT_ROUNDS = 12;

function md5(input: string): string {
  return createHash('md5').update(input).digest('hex');
}

function isLegacyHash(hash: string): boolean {
  return hash.startsWith('$2a$08$') || hash.startsWith('$2y$08$');
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (isLegacyHash(storedHash)) {
    const preHashed = md5(LEGACY_SALT + password);
    return bcrypt.compare(preHashed, storedHash);
  }
  return bcrypt.compare(password, storedHash);
}

export function needsRehash(storedHash: string): boolean {
  return isLegacyHash(storedHash);
}