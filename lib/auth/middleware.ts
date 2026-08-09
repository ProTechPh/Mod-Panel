import { NextRequest } from 'next/server';
import { verifyAccessToken } from './jwt';
import type { JwtPayload } from '@/types';

function extractBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  return null;
}

export async function authenticate(request: NextRequest): Promise<JwtPayload | null> {
  const bearerToken = extractBearerToken(request);
  const cookieToken = request.cookies.get('wp_access')?.value;
  const token = bearerToken || cookieToken;

  if (!token) return null;

  try {
    return await verifyAccessToken(token);
  } catch {
    return null;
  }
}