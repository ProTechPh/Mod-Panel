import { NextRequest } from 'next/server';
import { verifyAccessToken } from './jwt';
import type { JwtPayload } from '@/types';

export async function authenticate(request: NextRequest): Promise<JwtPayload | null> {
  const token = request.cookies.get('wp_access')?.value;
  if (!token) return null;

  try {
    return await verifyAccessToken(token);
  } catch {
    return null;
  }
}

export async function authenticateAdmin(request: NextRequest): Promise<JwtPayload | null> {
  const payload = await authenticate(request);
  if (!payload || payload.level !== 1) return null;
  return payload;
}