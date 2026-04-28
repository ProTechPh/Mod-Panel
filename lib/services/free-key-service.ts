import dbConnect from '@/lib/db/connection';
import Key from '@/lib/db/models/Key';
import IpTracker from '@/lib/db/models/IpTracker';
import { generateKeyString } from '@/lib/utils/device';
import GameSetting from '@/lib/db/models/GameSetting';

async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.warn('TURNSTILE_SECRET_KEY is not set. Free key requests will be rejected.');
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

async function checkVpn(ip: string): Promise<{ isVpn: boolean; isProxy: boolean; isp: string; org: string }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(`https://ip-api.com/json/${ip}?fields=isp,org,proxy,hosting`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      // API failure should NOT result in banning — fail open
      return { isVpn: false, isProxy: false, isp: '', org: '' };
    }

    const data = await res.json();
    return {
      // Only treat as VPN if BOTH hosting AND proxy are true to avoid
      // false positives from ISPs using CGNAT or shared datacenter ranges
      isVpn: data.hosting === true && data.proxy === true,
      isProxy: data.proxy === true,
      isp: data.isp || '',
      org: data.org || '',
    };
  } catch {
    clearTimeout(timeoutId);
    // API failure should NOT result in banning — fail open
    return { isVpn: false, isProxy: false, isp: '', org: '' };
  }
}

export async function generateFreeKey(game: string, turnstileToken: string, ip: string, registrator: string) {
  await dbConnect();

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

  const bannedTracker = await IpTracker.findOne({ ipAddress: ip, isBanned: true }).lean();
  if (bannedTracker) {
    return { error: 'Your IP has been banned' };
  }

  // Block only if the IP already has a non-expired free key FOR THIS SPECIFIC GAME.
  // Different games are independent — an active CODM key doesn't block an MLBB key.
  const existingTrackers = await IpTracker.find({ ipAddress: ip, isBanned: false })
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


  const vpnCheck = await checkVpn(ip);
  if (vpnCheck.isVpn || vpnCheck.isProxy) {
    const tracker = await IpTracker.findOne({ ipAddress: ip }).lean();
    if (tracker) {
      await IpTracker.updateOne({ _id: tracker._id }, { isBanned: true, banReason: 'VPN/Proxy detected', isVpn: vpnCheck.isVpn, isProxy: vpnCheck.isProxy });
    } else {
      await IpTracker.create({
        userId: '0',
        ipAddress: ip,
        generatorIp: ip,
        keyId: '000000000000000000000000',
        isp: vpnCheck.isp,
        org: vpnCheck.org,
        isVpn: vpnCheck.isVpn,
        isProxy: vpnCheck.isProxy,
        isBanned: true,
        banReason: 'VPN/Proxy detected',
      });
    }
    return { error: 'VPN/Proxy detected. Free keys are not available for VPN users.' };
  }

  const keyString = generateKeyString(16);
  // Set a 1-day "pending" expiry so unused keys auto-expire.
  // On first use (connect), this will be replaced with now + 1 hour.
  const pendingExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const key = await Key.create({
    game: game.toUpperCase(),
    userKey: keyString,
    duration: '1h',
    maxDevices: 1,
    devices: [],
    status: 1,
    registrator,
    isFreeKey: true,
    expiredDate: pendingExpiry,
  });

  await IpTracker.create({
    userId: '0',
    ipAddress: ip,
    generatorIp: ip,
    keyId: key._id,
    isp: vpnCheck.isp,
    org: vpnCheck.org,
    isVpn: false,
    isProxy: false,
  });

  return { key: keyString };
}

/**
 * Get the current user's free key for a given registrator + game, identified by IP.
 * Each game is independent — a user can have one active free key per game.
 */
export async function getMyFreeKey(ip: string, registrator: string, game: string) {
  await dbConnect();

  // Collect all tracker keyIds for this IP
  const trackers = await IpTracker.find({ ipAddress: ip, isBanned: false })
    .sort({ createdAt: -1 })
    .lean();

  if (!trackers.length) return { error: 'No free key found for your IP' };

  const keyIds = trackers.map(t => t.keyId);

  // Find the most recent free key for this IP + registrator + game
  const key = await Key.findOne({
    _id: { $in: keyIds },
    isFreeKey: true,
    registrator,
    game: game.toUpperCase(),
  }).sort({ createdAt: -1 }).lean() as import('@/types').KeyDoc | null;

  if (!key) return { error: 'No free key found for your IP' };

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
  };
}

export async function getMyFreeKeyHistory(ip: string, registrator: string) {
  await dbConnect();

  const trackers = await IpTracker.find({ ipAddress: ip, isBanned: false })
    .sort({ createdAt: -1 })
    .lean();

  if (!trackers.length) return [];

  const now = new Date();
  const results = await Promise.all(
    trackers.map(async (tracker) => {
      const key = await Key.findOne({
        _id: tracker.keyId,
        isFreeKey: true,
        registrator,
      }).lean() as import('@/types').KeyDoc | null;

      if (!key) return null;

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
      };
    })
  );

  return results.filter(Boolean);
}

export async function resetFreeKeyDevices(userKey: string, ip: string) {
  await dbConnect();


  const key = await Key.findOne({ userKey, isFreeKey: true }).lean() as import('@/types').KeyDoc | null;
  if (!key) return { error: 'Key not found' };

  // Verify IP ownership via IpTracker
  const tracker = await IpTracker.findOne({ keyId: key._id, isBanned: false }).lean();
  if (!tracker || tracker.generatorIp !== ip) {
    return { error: 'You can only reset devices from the same IP that generated this key' };
  }

  const resetsDone = key.deviceResetCount ?? 0;
  if (resetsDone >= 2) {
    return { error: 'Device reset limit reached (max 2 resets per free key)' };
  }

  await Key.updateOne({ _id: key._id }, { devices: [], $inc: { deviceResetCount: 1 } });

  return { success: true, resetsRemaining: 2 - (resetsDone + 1) };
}