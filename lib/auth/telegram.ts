import { createHash, createHmac } from 'crypto';

export interface TelegramAuthData {
  id: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: string;
  hash: string;
}

export function verifyTelegramAuth(data: TelegramAuthData, botToken: string): boolean {
  const { hash, ...rest } = data;

  // Filter out any fields that are not part of the standard Telegram auth
  // and remove any fields that have null, undefined, or empty string values.
  const checkString = Object.keys(rest)
    .filter(key => {
      const value = rest[key as keyof typeof rest];
      return value !== undefined && value !== null && value !== '' && key !== 'hash';
    })
    .sort()
    .map(key => `${key}=${rest[key as keyof typeof rest]}`)
    .join('\n');

  const secretKey = createHash('sha256').update(botToken).digest();

  const computedHash = createHmac('sha256', secretKey)
    .update(checkString)
    .digest('hex');

  return computedHash === hash;
}

export function isAuthDateValid(authDate: string, maxAgeSeconds: number = 86400): boolean {
  const authTimestamp = parseInt(authDate, 10);
  if (isNaN(authTimestamp)) return false;
  const now = Math.floor(Date.now() / 1000);
  return (now - authTimestamp) < maxAgeSeconds;
}