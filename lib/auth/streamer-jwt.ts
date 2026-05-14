import { SignJWT, jwtVerify } from 'jose';

const STREAMER_AUTH_SECRET = new TextEncoder().encode(process.env.AUTH_SECRET!);
const STREAMER_TOKEN_TTL = '12h';

export interface StreamerJwtPayload {
  streamerKey: string;
  streamerId: string;
  tiktokUsername: string;
}

export async function signStreamerToken(key: string, streamerId: string, tiktokUsername: string): Promise<string> {
  return new SignJWT({ streamerKey: key, streamerId, tiktokUsername })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(STREAMER_TOKEN_TTL)
    .sign(STREAMER_AUTH_SECRET);
}

export async function verifyStreamerToken(token: string): Promise<StreamerJwtPayload> {
  const { payload } = await jwtVerify(token, STREAMER_AUTH_SECRET);
  return payload as unknown as StreamerJwtPayload;
}
