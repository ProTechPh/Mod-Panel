import dbConnect from '@/lib/db/connection';
import Key from '@/lib/db/models/Key';
import IpTracker from '@/lib/db/models/IpTracker';
import GameSetting from '@/lib/db/models/GameSetting';
import { generateKeyString } from '@/lib/utils/device';
import { SignJWT, jwtVerify } from 'jose';
import { shortenUrl } from './reshortfly-service';
import type { KeyDoc } from '@/types';

async function verifyTurnstile(token: string | undefined, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    // If turnstile is not configured, we pass the validation
    return true;
  }

  if (!token) {
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

const JWT_SECRET = new TextEncoder().encode(process.env.AUTH_SECRET!);

async function createClaimToken(payload: Record<string, unknown>) {
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

/**
 * Returns the user's currently-active free key for the given game, if any.
 * Shared by the generation and claim flows.
 */
async function findActiveFreeKey(deviceId: string, ip: string, game: string): Promise<KeyDoc | null> {
  const deviceIdentifier = `device:${deviceId}`;
  const trackers = await IpTracker.find({
    $or: [
      { username: deviceIdentifier },
      { ipAddress: ip },
      { generatorIp: ip }
    ],
    isBanned: false
  })
    .sort({ createdAt: -1 })
    .lean();

  if (!trackers.length) return null;

  const keyIds = trackers.map(t => t.keyId);
  const existingKey = await Key.findOne({
    _id: { $in: keyIds },
    isFreeKey: true,
    game: game.toUpperCase(),
    status: 1,
  }).lean() as KeyDoc | null;

  const now = new Date();
  return existingKey && existingKey.expiredDate && new Date(existingKey.expiredDate) > now
    ? existingKey
    : null;
}

export async function generateFreeKey(game: string, turnstileToken: string | undefined, ip: string, registrator: string, deviceId: string) {
  await dbConnect();

  if (!deviceId) {
    return { error: 'Device ID is required to generate free keys' };
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

  const deviceIdentifier = `device:${deviceId}`;

  const bannedTracker = await IpTracker.findOne({
    $or: [
      { username: deviceIdentifier },
      { ipAddress: ip },
      { generatorIp: ip }
    ],
    isBanned: true
  }).lean();
  
  if (bannedTracker) {
    return { error: 'Your device or IP has been banned' };
  }

  const existingKey = await findActiveFreeKey(deviceId, ip, game);
  if (existingKey) {
    return { error: 'You still have an active free key for this game. Wait for it to expire before generating a new one.' };
  }

  const claimToken = await createClaimToken({ game, registrator, deviceId, ip });
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const targetUrl = `${baseUrl}/${registrator}/free-key?claimToken=${encodeURIComponent(claimToken)}`;
  const adUrl = await shortenUrl(targetUrl);
  return { adUrl: adUrl || targetUrl };
}

export async function claimFreeKey(token: string, currentIp: string, currentDeviceId: string) {
  await dbConnect();

  if (!currentDeviceId) {
    return { error: 'Device ID is required to claim free keys' };
  }

  const payload = await verifyClaimToken(token);
  if (!payload || typeof payload !== 'object') {
    return { error: 'Invalid or expired claim token' };
  }

  const { game, registrator, deviceId: originalDeviceId } = payload as unknown as { game: string; registrator: string; deviceId: string };

  if (originalDeviceId !== currentDeviceId) {
    return { error: 'Device mismatch. You must claim the key on the same browser/device that initiated the request.' };
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

  const existingKey = await findActiveFreeKey(currentDeviceId, currentIp, game);
  if (existingKey) {
    return { key: existingKey.userKey, game: existingKey.game };
  }

  const deviceIdentifier = `device:${currentDeviceId}`;
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
    username: deviceIdentifier,
    ipAddress: currentIp,
    generatorIp: currentIp,
    keyId: key._id,
    isp: '',
    org: '',
    isAdClaim: true,
  });

  return { key: keyString, game };
}

export async function getMyFreeKey(deviceId: string, ip: string, registrator: string, game: string) {
  await dbConnect();

  if (!deviceId) return { error: 'Device ID is required' };

  const deviceIdentifier = `device:${deviceId}`;

  const trackers = await IpTracker.find({
    $or: [
      { username: deviceIdentifier },
      { ipAddress: ip },
      { generatorIp: ip }
    ],
    isBanned: false
  })
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

export async function getMyFreeKeyHistory(deviceId: string, ip: string, registrator: string) {
  await dbConnect();

  if (!deviceId) return [];

  const deviceIdentifier = `device:${deviceId}`;

  const trackers = await IpTracker.find({
    $or: [
      { username: deviceIdentifier },
      { ipAddress: ip },
      { generatorIp: ip }
    ],
    isBanned: false
  })
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
      const key = tracker.keyId as unknown as import('@/types').KeyDoc;
      
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

export async function resetFreeKeyDevices(userKey: string, deviceId: string, ip: string) {
  await dbConnect();

  if (!deviceId) {
    return { error: 'Device ID is required' };
  }

  const key = await Key.findOne({ userKey, isFreeKey: true }).lean() as import('@/types').KeyDoc | null;
  if (!key) return { error: 'Key not found' };

  const deviceIdentifier = `device:${deviceId}`;
  const tracker = await IpTracker.findOne({
    keyId: key._id,
    $or: [
      { username: deviceIdentifier },
      { ipAddress: ip },
      { generatorIp: ip }
    ]
  }).lean();
  
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

  return results.map(r => {
    if (r.username && r.username.startsWith('device:')) {
      const uuidPart = r.username.slice(7);
      const guestId = uuidPart.replace(/-/g, '').slice(0, 6).toUpperCase();
      return {
        ...r,
        username: `Guest_${guestId}`,
      };
    }
    return r;
  });
}
