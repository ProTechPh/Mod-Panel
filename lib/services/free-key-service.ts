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
      return { isVpn: true, isProxy: true, isp: '', org: '' };
    }

    const data = await res.json();
    return {
      isVpn: data.hosting === true,
      isProxy: data.proxy === true,
      isp: data.isp || '',
      org: data.org || '',
    };
  } catch {
    clearTimeout(timeoutId);
    return { isVpn: true, isProxy: true, isp: '', org: '' };
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

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentKey = await IpTracker.findOne({
    ipAddress: ip,
    createdAt: { $gt: oneHourAgo },
  }).lean();
  if (recentKey) {
    return { error: 'You can only generate one free key per hour' };
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
  const key = await Key.create({
    game: game.toUpperCase(),
    userKey: keyString,
    duration: '1h',
    maxDevices: 1,
    devices: [],
    status: 1,
    registrator,
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