import { SignJWT, jwtVerify } from 'jose';
import type { JwtPayload, UserLevel } from '@/types';

const AUTH_SECRET = new TextEncoder().encode(process.env.AUTH_SECRET!);
const REFRESH_SECRET = new TextEncoder().encode(process.env.AUTH_REFRESH_SECRET!);
const ACCESS_TOKEN_TTL = '6h';
const REFRESH_TOKEN_TTL = '7d';

export async function signAccessToken(userId: string, username: string, level: UserLevel): Promise<string> {
  return new SignJWT({ userId, username, level })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_TTL)
    .sign(AUTH_SECRET);
}

export async function signRefreshToken(userId: string): Promise<string> {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_TTL)
    .sign(REFRESH_SECRET);
}

export async function verifyAccessToken(token: string): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, AUTH_SECRET);
  return payload as unknown as JwtPayload;
}

export async function verifyRefreshToken(token: string): Promise<{ userId: string }> {
  const { payload } = await jwtVerify(token, REFRESH_SECRET);
  return payload as unknown as { userId: string };
}