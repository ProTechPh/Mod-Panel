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
import IpTracker from '@/lib/db/models/IpTracker';
import type { Duration, KeyDoc, ServerConfigDoc, GameSettingDoc } from '@/types';

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

async function getGameSettings(): Promise<Map<string, GameSettingDoc>> {
  const now = Date.now();
  if (gameCache && now < gameCacheExpiry) return gameCache;
  const games = await GameSetting.find({}).lean();
  gameCache = new Map(games.map(g => [`${g.gameCode}|${g.registrator}`, g as unknown as GameSettingDoc]));
  gameCacheExpiry = now + CONFIG_TTL_MS;
  return gameCache!;
}

export function clearConfigCache() {
  configCache = null;
  configCacheExpiry = 0;
  gameCache = null;
  gameCacheExpiry = 0;
}

const DEFAULT_CONTACT = '@CanKillYouForever';

async function getTelegramContact(registrator: string, gameSetting?: GameSettingDoc | null): Promise<string> {
  // Prefer game-specific telegram channel from GameSetting
  if (gameSetting?.telegramChannel) return gameSetting.telegramChannel;
  if (registrator === 'FreeKey') return DEFAULT_CONTACT;
  const admin = await User.findOne({ username: registrator }).lean();
  return admin?.telegramContact || DEFAULT_CONTACT;
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

export async function validateKey(game: string, userKey: string, serial: string, connectIp: string) {
  await dbConnect();

  const config = await getServerConfig();
  if (config?.maintenanceStatus === 'on') {
    return { status: false, reason: config.maintenanceMessage || 'Under maintenance.' };
  }

  // Normalize game to uppercase — keys are stored uppercase
  const normalizedGame = game.toUpperCase();
  const key = await Key.findOne({ game: normalizedGame, userKey }).lean() as KeyDoc | null;
  if (!key) {
    return { status: false, reason: 'Incorrect Key' };
  }

  const games = await getGameSettings();
  const gameSetting = games.get(`${game.toUpperCase()}|${key.registrator}`);

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

  if (key.registrator === 'FreeKey') {
    const tracker = await IpTracker.findOne({ keyId: key._id }).lean();
    if (tracker && tracker.generatorIp !== connectIp) {
      // Invalidate the key but do NOT ban the generator IP.
      // IP changes are common (WiFi→mobile data, ISP rotation, router restart)
      // and CGNAT means one public IP is shared by many users.
      await Key.updateOne({ _id: key._id }, { status: 0 });
      return { status: false, reason: `Key invalidated - IP mismatch detected. Contact: ${contact}` };
    }
  }

  const now = new Date();

  if (key.isFreeKey) {
    // Free key dual-expiry logic:
    // - Before first use: expiredDate is set to now+1day (unused grace period)
    // - On first connect: replace expiredDate with now+1hour (active timer starts)
    const isFirstUse = !key.devices || key.devices.length === 0;
    if (isFirstUse) {
      // First use — start the 1-hour active timer now
      const activeExpiry = new Date(now.getTime() + 60 * 60 * 1000);
      await Key.updateOne({ _id: key._id }, { expiredDate: activeExpiry });
      key.expiredDate = activeExpiry;
    }
    // If not first use, expiredDate is already the 1-hour active timer — leave it alone
  } else if (!key.expiredDate) {
    // Standard paid key: set expiry on first connect
    let expiredDate: Date;
    if (key.duration === '1h') {
      expiredDate = new Date(now.getTime() + 60 * 60 * 1000);
    } else if (key.duration === '6h') {
      expiredDate = new Date(now.getTime() + 6 * 60 * 60 * 1000);
    } else {
      expiredDate = new Date(now.getTime() + (key.duration as number) * 24 * 60 * 60 * 1000);
    }
    await Key.updateOne({ _id: key._id }, { expiredDate });
    key.expiredDate = expiredDate;
  }

  if (key.expiredDate && new Date(key.expiredDate) < now) {
    return { status: false, reason: `Expired Key, Contact: ${contact}` };
  }

  const { allowed, shouldAdd } = checkDeviceSlot(key.devices || [], serial, key.maxDevices);
  if (!allowed) {
    return { status: false, reason: `Max Device Reached, Contact: ${contact}` };
  }
  if (shouldAdd) {
    await Key.updateOne({ _id: key._id }, { $push: { devices: serial } });
  }

  const { real, token } = generateTokenResult(game, userKey, serial);
  const expiredStr = key.expiredDate ? new Date(key.expiredDate).toISOString().replace('T', ' ').substring(0, 19) : '';

  return {
    status: true,
    data: {
      real,
      token,
      modname: gameSetting?.modName || '',
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
      EXP: expiredStr,
      device: key.maxDevices,
      rng: Math.floor(Date.now() / 1000),
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