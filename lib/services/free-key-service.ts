import dbConnect from '@/lib/db/connection';
import Key from '@/lib/db/models/Key';
import IpTracker from '@/lib/db/models/IpTracker';
import GameSetting from '@/lib/db/models/GameSetting';
import FreeKeyEntitlement from '@/lib/db/models/FreeKeyEntitlement';
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

  const body = new URLSearchParams({ secret, response: token });
  if (ip !== 'unknown') body.set('remoteip', ip);

  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    signal: AbortSignal.timeout(5000),
  });
  const data = await res.json();
  return data.success === true;
}

function getClaimSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error('AUTH_SECRET is required for free-key claims');
  return new TextEncoder().encode(secret);
}

function isDuplicateKeyError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
}

async function createClaimToken(payload: Record<string, unknown>) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer('mod-panel-free-key')
    .setAudience('free-key-claim')
    .setJti(crypto.randomUUID())
    .setIssuedAt()
    .setExpirationTime('10m')
    .sign(getClaimSecret());
}

async function verifyClaimToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getClaimSecret(), {
      issuer: 'mod-panel-free-key',
      audience: 'free-key-claim',
    });
    return payload;
  } catch {
    return null;
  }
}

/**
 * Returns the user's currently-active free key for the given game, if any.
 * Shared by the generation and claim flows.
 */
async function findCurrentFreeKey(deviceId: string, game: string, registrator: string): Promise<KeyDoc | null> {
  const deviceIdentifier = `device:${deviceId}`;
  const trackers = await IpTracker.find({
    username: deviceIdentifier,
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
    registrator,
    expiredDate: { $gt: new Date() },
  }).sort({ createdAt: -1 }).lean() as KeyDoc | null;

  return existingKey;
}

/**
 * Network matching is used only as an anti-abuse signal. The matching key is
 * never returned to the caller, so users behind a shared IP cannot read or
 * reset another device's license.
 */
async function hasActiveFreeKeyForNetwork(ip: string, game: string, registrator: string): Promise<boolean> {
  if (!ip || ip === 'unknown') return false;

  const trackers = await IpTracker.find({
    $or: [{ ipAddress: ip }, { generatorIp: ip }],
    isBanned: false,
  }).select('keyId').lean();

  if (!trackers.length) return false;

  return Boolean(await Key.exists({
    _id: { $in: trackers.map(tracker => tracker.keyId) },
    isFreeKey: true,
    game: game.toUpperCase(),
    registrator,
    status: 1,
    expiredDate: { $gt: new Date() },
  }));
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

  const existingKey = await findCurrentFreeKey(deviceId, game, registrator);
  if (existingKey) {
    if (existingKey.status !== 1) {
      return { error: 'Your current free key has been suspended. Contact the operator for assistance.' };
    }
    return { error: 'You still have an active free key for this game. Wait for it to expire before generating a new one.' };
  }

  if (await hasActiveFreeKeyForNetwork(ip, game, registrator)) {
    return { error: 'An active free key already exists for this game on your current network.' };
  }

  const claimToken = await createClaimToken({ game: game.toUpperCase(), registrator, deviceId });
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const targetUrl = `${baseUrl}/${encodeURIComponent(registrator)}/free-key?claimToken=${encodeURIComponent(claimToken)}`;
  const adUrl = await shortenUrl(targetUrl);
  if (!adUrl) {
    return { error: 'Sponsor link is temporarily unavailable. Please try again later.' };
  }
  return { adUrl };
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

  const { game, registrator, deviceId: originalDeviceId, jti } = payload;

  if (
    typeof game !== 'string' || !game ||
    typeof registrator !== 'string' || !registrator ||
    typeof originalDeviceId !== 'string' || !originalDeviceId ||
    typeof jti !== 'string' || !jti
  ) {
    return { error: 'Invalid claim token' };
  }

  if (originalDeviceId !== currentDeviceId) {
    return { error: 'Device mismatch. You must claim the key on the same browser/device that initiated the request.' };
  }

  const deviceIdentifier = `device:${currentDeviceId}`;
  const bannedTracker = await IpTracker.findOne({
    $or: [
      { username: deviceIdentifier },
      { ipAddress: currentIp },
      { generatorIp: currentIp },
    ],
    isBanned: true,
  }).lean();

  if (bannedTracker) {
    return { error: 'Your device or IP has been banned' };
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

  const existingKey = await findCurrentFreeKey(currentDeviceId, game, registrator);
  if (existingKey) {
    if (existingKey.status !== 1) {
      return { error: 'Your current free key has been suspended. Contact the operator for assistance.' };
    }
    return { key: existingKey.userKey, game: existingKey.game };
  }

  if (await hasActiveFreeKeyForNetwork(currentIp, game, registrator)) {
    return { error: 'An active free key already exists for this game on your current network.' };
  }

  const expiryHours = 3;
  const expiredDate = new Date(Date.now() + expiryHours * 60 * 60 * 1000);
  const ownerScope = `${currentDeviceId}:${registrator}:${game.toUpperCase()}`;
  const reservationTime = new Date();
  let entitlement = await FreeKeyEntitlement.findOne({
    scope: ownerScope,
    expiresAt: { $gt: reservationTime },
  }).lean() as { claimId: string } | null;

  if (!entitlement) {
    try {
      entitlement = await FreeKeyEntitlement.findOneAndUpdate(
        {
          scope: ownerScope,
          $or: [
            { expiresAt: { $lte: reservationTime } },
            { expiresAt: { $exists: false } },
          ],
        },
        { $set: { claimId: jti, expiresAt: expiredDate } },
        { upsert: true, returnDocument: 'after' },
      ).lean() as { claimId: string } | null;
    } catch (error) {
      if (!isDuplicateKeyError(error)) throw error;
      entitlement = await FreeKeyEntitlement.findOne({ scope: ownerScope }).lean() as { claimId: string } | null;
    }
  }

  if (!entitlement?.claimId) return { error: 'Failed to reserve free-key entitlement' };
  const effectiveClaimId = entitlement.claimId;

  let key: KeyDoc | null;
  try {
    key = await Key.findOneAndUpdate(
      { freeKeyClaimId: effectiveClaimId },
      {
        $setOnInsert: {
          game: game.toUpperCase(),
          userKey: generateKeyString(16),
          duration: '3h',
          maxDevices: 1,
          devices: [],
          status: 1,
          registrator,
          isFreeKey: true,
          freeKeyClaimId: effectiveClaimId,
          freeKeyActivatedAt: null,
          expiredDate,
        },
      },
      { upsert: true, returnDocument: 'after' },
    ).lean() as KeyDoc | null;
  } catch (error) {
    if (!isDuplicateKeyError(error)) throw error;
    key = await Key.findOne({ freeKeyClaimId: effectiveClaimId }).lean() as KeyDoc | null;
  }

  if (!key) return { error: 'Failed to create free key' };
  if (key.status !== 1) return { error: 'This free key has been suspended' };
  if (!key.expiredDate || new Date(key.expiredDate) <= new Date()) {
    return { error: 'This free key has expired. Please request a new sponsor link.' };
  }

  try {
    await IpTracker.findOneAndUpdate(
      { freeKeyClaimId: effectiveClaimId },
      {
        $setOnInsert: {
          userId: '0',
          username: deviceIdentifier,
          ipAddress: currentIp,
          generatorIp: currentIp,
          keyId: key._id,
          isp: '',
          org: '',
          isAdClaim: true,
          freeKeyClaimId: effectiveClaimId,
        },
      },
      { upsert: true, returnDocument: 'after' },
    );
  } catch (error) {
    if (!isDuplicateKeyError(error)) throw error;
  }

  return { key: key.userKey, game: key.game };
}

export async function getMyFreeKey(deviceId: string, registrator: string, game: string) {
  await dbConnect();

  if (!deviceId) return { error: 'Device ID is required' };

  const deviceIdentifier = `device:${deviceId}`;

  const trackers = await IpTracker.find({
    username: deviceIdentifier,
    isBanned: false
  })
    .sort({ createdAt: -1 })
    .lean();

  if (!trackers.length) return { error: 'No free key found' };

  const keyIds = trackers.map(t => t.keyId);

  const keyFilter = {
    _id: { $in: keyIds },
    isFreeKey: true,
    registrator,
    game: game.toUpperCase(),
  };

  const now = new Date();
  const key = await Key.findOne({
    ...keyFilter,
    status: 1,
    expiredDate: { $gt: now },
  }).sort({ createdAt: -1 }).lean() as KeyDoc | null
    ?? await Key.findOne(keyFilter).sort({ createdAt: -1 }).lean() as KeyDoc | null;

  if (!key) return { error: 'No free key found' };

  const isExpired = key.expiredDate ? new Date(key.expiredDate) <= now : false;
  const isActivated = Boolean(key.freeKeyActivatedAt) || (key.devices?.length ?? 0) > 0 || (key.deviceResetCount ?? 0) > 0;
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

export async function getMyFreeKeyHistory(deviceId: string, registrator: string) {
  await dbConnect();

  if (!deviceId) return [];

  const deviceIdentifier = `device:${deviceId}`;

  const trackers = await IpTracker.find({
    username: deviceIdentifier,
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
      
      const isExpired = key.expiredDate ? new Date(key.expiredDate) <= now : false;
      const isActivated = Boolean(key.freeKeyActivatedAt) || (key.devices?.length ?? 0) > 0 || (key.deviceResetCount ?? 0) > 0;

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

export async function resetFreeKeyDevices(userKey: string, deviceId: string) {
  await dbConnect();

  if (!deviceId) {
    return { error: 'Device ID is required' };
  }

  const key = await Key.findOne({ userKey, isFreeKey: true }).lean() as import('@/types').KeyDoc | null;
  if (!key) return { error: 'Key not found' };

  const deviceIdentifier = `device:${deviceId}`;
  const tracker = await IpTracker.findOne({
    keyId: key._id,
    username: deviceIdentifier,
    isBanned: false,
  }).lean();
  
  if (!tracker) {
    return { error: 'You can only reset devices for your own key' };
  }

  if (!key.devices?.length) {
    return { error: 'There are no attached devices to reset' };
  }

  const now = new Date();
  const inferredActivation = key.freeKeyActivatedAt
    ?? (key.expiredDate ? new Date(new Date(key.expiredDate).getTime() - 3 * 60 * 60 * 1000) : now);
  const updatedKey = await Key.findOneAndUpdate(
    {
      _id: key._id,
      status: 1,
      expiredDate: { $gt: now },
      'devices.0': { $exists: true },
      $or: [
        { deviceResetCount: { $lt: 2 } },
        { deviceResetCount: { $exists: false } },
      ],
    },
    {
      $set: { devices: [], freeKeyActivatedAt: inferredActivation },
      $inc: { deviceResetCount: 1 },
    },
    { returnDocument: 'after' },
  ).lean() as KeyDoc | null;

  if (!updatedKey) {
    const latestKey = await Key.findById(key._id).lean() as KeyDoc | null;
    if (!latestKey?.devices?.length) return { error: 'There are no attached devices to reset' };
    if (latestKey.status !== 1) return { error: 'Suspended keys cannot be reset' };
    if (!latestKey.expiredDate || new Date(latestKey.expiredDate) <= now) return { error: 'Expired keys cannot be reset' };
    return { error: 'Device reset limit reached (max 2 resets per free key)' };
  }

  return { success: true, resetsRemaining: Math.max(0, 2 - (updatedKey.deviceResetCount ?? 0)) };
}

export async function getTopAdClaimers(registrator: string, limit: number = 10) {
  await dbConnect();

  const results = await IpTracker.aggregate([
    { $match: { isAdClaim: true, isBanned: false, username: { $ne: '' } } },
    {
      $lookup: {
        from: 'keys',
        localField: 'keyId',
        foreignField: '_id',
        as: 'key',
      },
    },
    { $unwind: '$key' },
    { $match: { 'key.isFreeKey': true, 'key.registrator': registrator } },
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
