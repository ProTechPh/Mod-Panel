import { createHash } from 'crypto';
import { STATIC_WORDS } from '@/types';

export interface TokenResult {
  real: string;
  token: string;
}

export function generateToken(game: string, userKey: string, serial: string): TokenResult {
  const real = `${game}-${userKey}-${serial}-${STATIC_WORDS}`;
  const token = createHash('md5').update(real).digest('hex');
  return { real, token };
}

export function generateTokenResult(game: string, userKey: string, serial: string) {
  const real = `${game}-${userKey}-${serial}-${STATIC_WORDS}`;
  const token = createHash('md5').update(real).digest('hex');
  return { real, token };
}