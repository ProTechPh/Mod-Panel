import dbConnect from '@/lib/db/connection';
import Key from '@/lib/db/models/Key';
import IpTracker from '@/lib/db/models/IpTracker';
import { generateKeyString } from '@/lib/utils/device';
import GameSetting from '@/lib/db/models/GameSetting';
import { Logger } from '@/lib/utils';

async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    Logger.warn('TURNSTILE_SECRET_KEY is not set. Free key requests will be rejected.');
    return false;
  }

  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `secret=${secret}&response=${token}&remoteip=${ip}`,
    signal: AbortSignal.timeout(5000),
  });
  const data = await res.json();
  return data.success === true;
}

import { shortenUrl } from './reshortfly-service';

import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.AUTH_SECRET!);

async function createClaimToken(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('10m')
    .sign(JWT_SECRET);
}

async function verifyClaimToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch {
    return null;
  }
}

export async function generateFreeKey(game: string, turnstileToken: string, ip: string, registrator: string, username: string) {
  await dbConnect();

  if (!username) {
    return { error: 'You must be logged in to generate free keys' };
  }

  const gameSetting = await GameSetting.findOne({
    gameCode: game.toUpperCase(),
    registrator,
    isEnabled: true,
    freeKeyEnabled: true,
  }).lean();

  if (!gameSetting) {
    return { error: 'Free keys are not available for this game from this reseller' };
  }

  const turnstileValid = await verifyTurnstile(turnstileToken, ip);
  if (!turnstileValid) {
    return { error: 'Captcha verification failed' };
  }

  const bannedTracker = await IpTracker.findOne({ username, isBanned: true }).lean();
  if (bannedTracker) {
    return { error: 'Your account has been banned' };
  }

  const existingTrackers = await IpTracker.find({ username, isBanned: false })
    .sort({ createdAt: -1 })
    .lean();
  if (existingTrackers.length) {
    const keyIds = existingTrackers.map(t => t.keyId);
    const existingKey = await Key.findOne({
      _id: { $in: keyIds },
      isFreeKey: true,
      game: game.toUpperCase(),
      status: 1,
    }).lean() as import('@/types').KeyDoc | null;
    const now = new Date();
    const isStillActive = existingKey &&
      existingKey.expiredDate &&
      new Date(existingKey.expiredDate) > now;
    if (isStillActive) {
      return { error: 'You still have an active free key for this game. Wait for it to expire before generating a new one.' };
    }
  }

  const claimToken = await createClaimToken({ game, registrator, username, ip });
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const targetUrl = `${baseUrl}/${registrator}/free-key?claimToken=${encodeURIComponent(claimToken)}`;
  const adUrl = await shortenUrl(targetUrl);
  return { adUrl: adUrl || targetUrl };
}

export async function claimFreeKey(token: string, currentIp: string, currentUsername: string) {
  await dbConnect();

  if (!currentUsername) {
    return { error: 'You must be logged in to claim free keys' };
  }

  const payload = await verifyClaimToken(token);
  if (!payload || typeof payload !== 'object') {
    return { error: 'Invalid or expired claim token' };
  }

  const { game, registrator, username: originalUsername } = payload as any;

  if (originalUsername !== currentUsername) {
    return { error: 'Account mismatch. You must claim the key from the same account that generated the request.' };
  }

  const gameSetting = await GameSetting.findOne({
    gameCode: game.toUpperCase(),
    registrator,
    isEnabled: true,
    freeKeyEnabled: true,
  }).lean();

  if (!gameSetting) {
    return { error: 'Free keys are no longer available for this game. The offer may have ended.' };
  }

  const existingTrackers = await IpTracker.find({ username: currentUsername, isBanned: false })
    .sort({ createdAt: -1 })
    .lean();
  
  if (existingTrackers.length) {
    const keyIds = existingTrackers.map(t => t.keyId);
    const existingKey = await Key.findOne({
      _id: { $in: keyIds },
      isFreeKey: true,
      game: game.toUpperCase(),
      status: 1,
    }).lean() as import('@/types').KeyDoc | null;
    
    const now = new Date();
    if (existingKey && existingKey.expiredDate && new Date(existingKey.expiredDate) > now) {
      return { key: existingKey.userKey, game: existingKey.game };
    }
  }

  const keyString = generateKeyString(16);
  const expiryHours = 3;
  const expiredDate = new Date(Date.now() + expiryHours * 60 * 60 * 1000);
  const key = await Key.create({
    game: game.toUpperCase(),
    userKey: keyString,
    duration: '3h',
    maxDevices: 1,
    devices: [],
    status: 1,
    registrator,
    isFreeKey: true,
    expiredDate,
  });

  await IpTracker.create({
    userId: '0',
    username: currentUsername,
    ipAddress: currentIp,
    generatorIp: currentIp,
    keyId: key._id,
    isp: '',
    org: '',
    isAdClaim: true,
  });

  return { key: keyString, game };
}

export async function getMyFreeKey(username: string, registrator: string, game: string) {
  await dbConnect();

  if (!username) return { error: 'You must be logged in' };

  const trackers = await IpTracker.find({ username, isBanned: false })
    .sort({ createdAt: -1 })
    .lean();

  if (!trackers.length) return { error: 'No free key found' };

  const keyIds = trackers.map(t => t.keyId);

  const key = await Key.findOne({
    _id: { $in: keyIds },
    isFreeKey: true,
    registrator,
    game: game.toUpperCase(),
  }).sort({ createdAt: -1 }).lean() as import('@/types').KeyDoc | null;

  if (!key) return { error: 'No free key found' };

  const now = new Date();
  const isExpired = key.expiredDate ? new Date(key.expiredDate) < now : false;
  const isActivated = (key.devices?.length ?? 0) > 0;
  const resetsRemaining = Math.max(0, 2 - (key.deviceResetCount ?? 0));

  return {
    key: key.userKey,
    game: key.game,
    status: key.status,
    isActivated,
    isExpired,
    expiredDate: key.expiredDate ? new Date(key.expiredDate).toISOString() : null,
    deviceCount: key.devices?.length ?? 0,
    resetsRemaining,
    duration: key.duration || '3h',
  };
}

export async function getMyFreeKeyHistory(username: string, registrator: string) {
  await dbConnect();

  if (!username) return [];

  const trackers = await IpTracker.find({ username, isBanned: false })
    .populate({
      path: 'keyId',
      match: { isFreeKey: true, registrator }
    })
    .sort({ createdAt: -1 })
    .lean();

  if (!trackers.length) return [];

  const now = new Date();
  
  const results = trackers
    .filter(t => t.keyId && typeof t.keyId === 'object')
    .map((tracker) => {
      const key = tracker.keyId as any;
      
      const isExpired = key.expiredDate ? new Date(key.expiredDate) < now : false;
      const isActivated = (key.devices?.length ?? 0) > 0;

      return {
        key: key.userKey,
        game: key.game,
        generatedAt: tracker.createdAt ? new Date(tracker.createdAt).toISOString() : null,
        expiredDate: key.expiredDate ? new Date(key.expiredDate).toISOString() : null,
        status: key.status,
        isActivated,
        isExpired,
        isAdClaim: !!tracker.isAdClaim,
      };
    });

  return results;
}

export async function resetFreeKeyDevices(userKey: string, username: string) {
  await dbConnect();

  if (!username) {
    return { error: 'You must be logged in' };
  }

  const key = await Key.findOne({ userKey, isFreeKey: true }).lean() as import('@/types').KeyDoc | null;
  if (!key) return { error: 'Key not found' };

  const tracker = await IpTracker.findOne({ keyId: key._id, username }).lean();
  if (!tracker) {
    return { error: 'You can only reset devices for your own key' };
  }

  const resetsDone = key.deviceResetCount ?? 0;
  if (resetsDone >= 2) {
    return { error: 'Device reset limit reached (max 2 resets per free key)' };
  }

  await Key.updateOne({ _id: key._id }, { devices: [], $inc: { deviceResetCount: 1 } });

  return { success: true, resetsRemaining: 2 - (resetsDone + 1) };
}

export async function getTopAdClaimers(limit: number = 10) {
  await dbConnect();

  const results = await IpTracker.aggregate([
    { $match: { isAdClaim: true, username: { $ne: '' } } },
    {
      $group: {
        _id: '$username',
        count: { $sum: 1 },
        lastClaim: { $max: '$createdAt' }
      }
    },
    { $sort: { count: -1, lastClaim: -1 } },
    { $limit: limit },
    {
      $project: {
        _id: 0,
        username: '$_id',
        count: 1,
        lastClaim: 1
      }
    }
  ]);

  return results;
}
