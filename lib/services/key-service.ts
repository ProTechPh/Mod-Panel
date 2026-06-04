import dbConnect from '@/lib/db/connection';
import Key from '@/lib/db/models/Key';
import History from '@/lib/db/models/History';
import { generateKeyString } from '@/lib/utils/device';
import { getPrice, deductSaldo } from '@/lib/utils/pricing';
import { generateTokenResult } from '@/lib/utils/token';
import { checkDeviceSlot } from '@/lib/utils/device';
import User from '@/lib/db/models/User';
import GameSetting from '@/lib/db/models/GameSetting';
import ServerConfig, { SingletonId } from '@/lib/db/models/ServerConfig';
import crypto from 'crypto';
import { createCipheriv, createDecipheriv } from 'crypto';
import type { Duration, KeyDoc, ServerConfigDoc, GameSettingDoc } from '@/types';
import { Logger } from '@/lib/utils';

let configCache: ServerConfigDoc | null = null;
let configCacheExpiry = 0;
const CONFIG_TTL_MS = 60_000;

let gameCache: Map<string, GameSettingDoc> | null = null;
let gameCacheExpiry = 0;

async function getServerConfig(): Promise<ServerConfigDoc | null> {
  const now = Date.now();
  if (configCache && now < configCacheExpiry) return configCache;
  configCache = await ServerConfig.findById(SingletonId).lean() as ServerConfigDoc | null;
  configCacheExpiry = now + CONFIG_TTL_MS;
  return configCache;
}

async function getGameSetting(gameCode: string, registrator: string): Promise<GameSettingDoc | null> {
  const now = Date.now();
  const cacheKey = `${gameCode.toUpperCase()}|${registrator}`;
  if (gameCache && now < gameCacheExpiry) {
    return gameCache.get(cacheKey) || null;
  }
  // If cache expired, just fetch the specific one to save bandwidth
  const setting = await GameSetting.findOne({ gameCode: gameCode.toUpperCase(), registrator }).lean() as GameSettingDoc | null;
  return setting;
}

export function clearConfigCache() {
  configCache = null;
  configCacheExpiry = 0;
  gameCache = null;
  gameCacheExpiry = 0;
}

const DEFAULT_CONTACT = '@CanKillYouForever';

const contactCache = new Map<string, { contact: string; expiry: number }>();

async function getTelegramContact(registrator: string, gameSetting?: GameSettingDoc | null): Promise<string> {
  if (gameSetting?.telegramChannel) return gameSetting.telegramChannel;
  if (registrator === 'FreeKey') return DEFAULT_CONTACT;

  const now = Date.now();
  const cached = contactCache.get(registrator);
  if (cached && now < cached.expiry) return cached.contact;

  const admin = await User.findOne({ username: registrator }).lean();
  const contact = admin?.telegramContact || DEFAULT_CONTACT;
  contactCache.set(registrator, { contact, expiry: now + CONFIG_TTL_MS });
  return contact;
}

export async function generateKeys(
  userId: string,
  username: string,
  game: string,
  duration: Duration,
  maxDevices: number,
  count: number,
  userLevel?: number
) {
  await dbConnect();

  const price = getPrice(duration, count, maxDevices);
  if (price === false) return { error: 'Invalid duration' };

  const user = await User.findById(userId);
  if (!user) return { error: 'User not found' };

  // Owner has unlimited saldo
  const isOwner = userLevel === 1 || user.level === 1;
  const newSaldo = isOwner ? user.saldo : deductSaldo(user.saldo, price);
  if (!isOwner && newSaldo === false) return { error: 'Insufficient saldo' };

  const keys: string[] = [];
  const keyDocs: InstanceType<typeof Key>[] = [];

  for (let i = 0; i < count; i++) {
    const keyString = generateKeyString(16);
    keys.push(keyString);
    keyDocs.push(new Key({
      game: game.toUpperCase(),
      userKey: keyString,
      duration,
      maxDevices,
      devices: [],
      status: 1,
      registrator: username,
    }));
  }

  await Key.insertMany(keyDocs);
  if (!isOwner) await User.updateOne({ _id: userId }, { saldo: newSaldo });

  await History.create({
    keyId: keys.join(','),
    userDo: username,
    info: `${game}|${keys[0]?.substring(0, 4)}...|${duration}|${maxDevices}`,
  });

  return { keys, newSaldo: isOwner ? user.saldo : (newSaldo as number) };
}

export async function validateKey(game: string, userKey: string, serial: string) {
  await dbConnect();

  const config = await getServerConfig();
  if (config?.maintenanceStatus === 'on') {
    return { status: false, reason: config.maintenanceMessage || 'Under maintenance.' };
  }

  // Find the key by userKey first to detect the correct game product
  const key = await Key.findOne({ userKey }).lean() as KeyDoc | null;
  if (!key) {
    return { status: false, reason: 'Incorrect Key' };
  }

  // Use the actual game product from the key record
  const normalizedGame = key.game.toUpperCase();
  const activeGame = normalizedGame;

  const gameSetting = await getGameSetting(activeGame, key.registrator);
  const contact = await getTelegramContact(key.registrator, gameSetting);

  if (gameSetting && !gameSetting.connectEnabled) {
    return {
      status: false,
      reason: gameSetting.maintenanceMessage || `${game} is currently under maintenance. Please try again later.`,
    };
  }

  if (key.status !== 1) {
    return { status: false, reason: `Suspended Key, Contact: ${contact}` };
  }


  const now = new Date();
  const update: Record<string, any> = {};
  let finalExpiredDate = key.expiredDate;

  if (key.isFreeKey) {
    const isFirstUse = !key.devices || key.devices.length === 0;
    if (isFirstUse) {
      let durationMs = 60 * 60 * 1000;
      if (key.duration === '3h') durationMs = 3 * 60 * 60 * 1000;
      finalExpiredDate = new Date(now.getTime() + durationMs);
      update.expiredDate = finalExpiredDate;
    }
  } else if (!key.expiredDate) {
    if (key.duration === '1h') {
      finalExpiredDate = new Date(now.getTime() + 60 * 60 * 1000);
    } else if (key.duration === '3h') {
      finalExpiredDate = new Date(now.getTime() + 3 * 60 * 60 * 1000);
    } else {
      finalExpiredDate = new Date(now.getTime() + (key.duration as number) * 24 * 60 * 60 * 1000);
    }
    update.expiredDate = finalExpiredDate;
  }

  if (finalExpiredDate && new Date(finalExpiredDate) < now) {
    return { status: false, reason: `Expired Key, Contact: ${contact}` };
  }

  const { allowed, shouldAdd } = checkDeviceSlot(key.devices || [], serial, key.maxDevices);
  if (!allowed) {
    return { status: false, reason: `Max Device Reached, Contact: ${contact}` };
  }
  if (shouldAdd) {
    update.$push = { devices: serial };
  }

  // Execute all updates in a single call to minimize latency
  if (Object.keys(update).length > 0) {
    await Key.updateOne({ _id: key._id }, update);
  }

  const modName = gameSetting?.modName || activeGame;
  const { real, token } = generateTokenResult(modName, userKey, serial);
  const expiredStr = finalExpiredDate ? new Date(finalExpiredDate).toISOString().replace('T', ' ').substring(0, 19) : '';

  return {
    status: true,
    data: {
      real,
      token,
      gameCode: activeGame,
      modname: modName,
      mod_status: gameSetting?.floatingTextStatus || '',
      credit: gameSetting?.floatingText || '',
      ESP: gameSetting?.features.esp ?? false,
      Item: gameSetting?.features.item ?? false,
      AIM: gameSetting?.features.aim ?? false,
      SilentAim: gameSetting?.features.silentAim ?? false,
      BulletTrack: gameSetting?.features.bulletTrack ?? false,
      Floating: gameSetting?.features.floating ?? false,
      Memory: gameSetting?.features.memory ?? false,
      Setting: gameSetting?.features.setting ?? false,
      patches: encryptPatches(gameSetting?.patches || ''),
      patch_version: gameSetting?.patchVersion || 1,
      EXP: expiredStr,
      device: key.maxDevices,
      rng: Math.floor(Date.now() / 1000),
      registrator: key.registrator,
      announcement: gameSetting?.announcementStatus === 'on' ? (gameSetting?.announcement || '') : '',
      offsets: {
        patch1: "6A08590",
        patch2: "A9A4A8C",
        patch3: "A9A4C7C",
        patch4: "647C5B8",
        offset_a1: "8D781DC",
        offset_blue1: "B8D0FD4",
        offset_blue2: "B8C3770"
      }
    },
  };
}

export async function listKeys(params: {
  draw: number;
  start: number;
  length: number;
  search?: string;
  order?: { column: number; dir: 'asc' | 'desc' }[];
  registrator?: string;
  game?: string;
}) {
  await dbConnect();

  const filter: Record<string, unknown> = {};
  if (params.search) {
    filter.$or = [
      { userKey: { $regex: params.search, $options: 'i' } },
      { game: { $regex: params.search, $options: 'i' } },
      { registrator: { $regex: params.search, $options: 'i' } },
    ];
  }
  if (params.registrator) filter.registrator = params.registrator;
  if (params.game) filter.game = params.game;

  const recordsTotal = await Key.countDocuments({});
  const recordsFiltered = await Key.countDocuments(filter);

  const sortColumn = ['createdAt', 'game', 'userKey', 'duration', 'maxDevices', 'status', 'expiredDate'][params.order?.[0]?.column ?? 0] || 'createdAt';
  const sortDir = params.order?.[0]?.dir === 'asc' ? 1 : -1;

  const data = await Key.find(filter)
    .sort({ [sortColumn]: sortDir })
    .skip(params.start)
    .limit(params.length)
    .lean();

  return {
    draw: params.draw,
    recordsTotal,
    recordsFiltered,
    data: data.map(k => ({
      ...k,
      _id: k._id.toString(),
      expiredDate: k.expiredDate?.toISOString() || null,
      createdAt: k.createdAt?.toISOString(),
    })),
  };
}

export async function getKey(id: string) {
  await dbConnect();
  const key = await Key.findById(id).lean();
  if (!key) return null;
  return { ...key, _id: key._id.toString() };
}

export async function updateKey(id: string, data: Partial<KeyDoc>) {
  await dbConnect();
  const update: Record<string, unknown> = {};
  if (data.game !== undefined) update.game = data.game;
  if (data.userKey !== undefined) update.userKey = data.userKey;
  if (data.duration !== undefined) update.duration = data.duration;
  if (data.maxDevices !== undefined) update.maxDevices = data.maxDevices;
  if (data.status !== undefined) update.status = data.status;

  const key = await Key.findByIdAndUpdate(id, update, { returnDocument: 'after' }).lean();
  return key ? { ...key, _id: key._id.toString() } : null;
}

export async function deleteKey(id: string) {
  await dbConnect();
  const result = await Key.deleteOne({ _id: id });
  return result.deletedCount > 0;
}

export async function resetDevices(id: string) {
  await dbConnect();
  const key = await Key.findByIdAndUpdate(id, { devices: [] }, { returnDocument: 'after' }).lean();
  return key ? { ...key, _id: key._id.toString() } : null;
}

export async function bulkDelete(filter: string, game?: string) {
  await dbConnect();
  const query: Record<string, unknown> = {};

  if (game) query.game = game;

  const now = new Date();
  switch (filter) {
    case 'expired':
      query.expiredDate = { $lt: now };
      break;
    case 'blocked':
      query.status = 0;
      break;
    case 'unused':
      query.expiredDate = null;
      break;
    case 'all':
      break;
    default:
      return 0;
  }

  const result = await Key.deleteMany(query);
  return result.deletedCount;
}

export async function getKeyStats(registrator?: string) {
  await dbConnect();
  const now = new Date();
  const filter: Record<string, unknown> = {};
  if (registrator) filter.registrator = registrator;

  const [total, active, expired, blocked, unused] = await Promise.all([
    Key.countDocuments({ ...filter }),
    Key.countDocuments({ ...filter, status: 1, expiredDate: { $gt: now } }),
    Key.countDocuments({ ...filter, expiredDate: { $lt: now } }),
    Key.countDocuments({ ...filter, status: 0 }),
    Key.countDocuments({ ...filter, expiredDate: null }),
  ]);

  return { total, active, expired, blocked, unused };
}

export async function extendKeyDuration(keyId: string, additionalDays: number, user: { level: number; username: string }) {
  await dbConnect();

  const key = await Key.findById(keyId).lean() as KeyDoc | null;
  if (!key) return null;

  const now = new Date();
  const currentExpired = key.expiredDate ? new Date(key.expiredDate) : now;

  // If expired or not started, extend from now
  const newExpiredDate = new Date(Math.max(currentExpired.getTime(), now.getTime()) + additionalDays * 24 * 60 * 60 * 1000);

  const update: Record<string, unknown> = { expiredDate: newExpiredDate };
  if (key.status !== 1) update.status = 1;

  const result = await Key.findByIdAndUpdate(keyId, update, { returnDocument: 'after' }).lean();
  if (!result) return null;

  // Log history
  await History.create({
    keyId: keyId,
    userDo: user.username,
    info: `Extended key ${key.userKey} by ${additionalDays} days`,
  });

  return { ...result, _id: result._id.toString(), expiredDate: result.expiredDate?.toISOString() || null };
}

export async function deleteKeysByGame(game: string, registrator?: string) {
  await dbConnect();
  const filter: Record<string, unknown> = { game };
  if (registrator) filter.registrator = registrator;

  const result = await Key.deleteMany(filter);
  return result.deletedCount;
}
function encryptPatches(text: string): string {
  if (!text) return '';
  
  try {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
      Logger.warn('ENCRYPTION_KEY is not set');
      return '';
    }
    
    const crypto = require('crypto');
    const cipher = crypto.createCipheriv('aes-256-ecb', Buffer.from(key), null);
    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return encrypted;
  } catch (err) {
    Logger.error('Encryption failed', { error: err instanceof Error ? err.message : 'Unknown error' });
    return '';
  }
}
