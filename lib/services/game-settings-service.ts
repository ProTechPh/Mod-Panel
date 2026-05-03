import dbConnect from '@/lib/db/connection';
import GameSetting from '@/lib/db/models/GameSetting';
import Key from '@/lib/db/models/Key';
import { clearConfigCache } from './key-service';

export async function listGameSettings(registrator?: string) {
  await dbConnect();
  const filter = registrator ? { registrator } : {};
  const games = await GameSetting.find(filter).sort({ gameCode: 1 }).lean();
  return games.map(g => ({
    ...g,
    _id: g._id.toString(),
    createdAt: g.createdAt?.toISOString(),
    updatedAt: g.updatedAt?.toISOString(),
  }));
}

export async function getGameSetting(gameCode: string, registrator?: string) {
  await dbConnect();
  const filter: Record<string, unknown> = { gameCode: gameCode.toUpperCase() };
  if (registrator) filter.registrator = registrator;
  const game = await GameSetting.findOne(filter).lean();
  if (!game) return null;
  return { ...game, _id: game._id.toString(), createdAt: game.createdAt?.toISOString(), updatedAt: game.updatedAt?.toISOString() };
}

export async function addGameSetting(data: {
  gameCode: string;
  gameName: string;
  registrator: string;
  isEnabled?: boolean;
  connectEnabled?: boolean;
  freeKeyEnabled?: boolean;
}) {
  await dbConnect();
  const game = await GameSetting.create({
    gameCode: data.gameCode.toUpperCase(),
    gameName: data.gameName,
    registrator: data.registrator,
    isEnabled: data.isEnabled ?? true,
    connectEnabled: data.connectEnabled ?? true,
    freeKeyEnabled: data.freeKeyEnabled ?? true,
    maintenanceMessage: '',
    downloadLink: '',
    floatingTextStatus: '',
    floatingText: '',
    modName: '',
    telegramChannel: '',
    telegramGroup: '',
    features: { esp: false, item: false, silentAim: false, aim: false, bulletTrack: false, memory: false, floating: false, setting: false },
  });
  clearConfigCache();
  return { ...game.toObject(), _id: game._id.toString() };
}

export async function updateGameSetting(gameCode: string, data: {
  gameName?: string;
  isEnabled?: boolean;
  connectEnabled?: boolean;
  freeKeyEnabled?: boolean;
  maintenanceMessage?: string;
  downloadLink?: string;
  floatingTextStatus?: string;
  floatingText?: string;
  modName?: string;
  telegramChannel?: string;
  telegramGroup?: string;
  features?: Record<string, boolean>;
  patches?: string;
}, registrator?: string) {
  await dbConnect();
  const filter: Record<string, unknown> = { gameCode: gameCode.toUpperCase() };
  if (registrator) filter.registrator = registrator;

  // Strip non-schema fields before update
  const { gameCode: _gc, registrator: _reg, _method: _m, ...updateData } = data as Record<string, unknown>;

  // ── Per-game maintenance timer pause / resume ─────────────────────────────
  if (data.connectEnabled !== undefined) {
    if (data.connectEnabled === false) {
      // Maintenance starting — record the timestamp
      updateData.maintenanceStartedAt = new Date();
    } else {
      // Maintenance ending — extend affected keys by elapsed duration
      const current = await GameSetting.findOne(filter).lean();
      const startedAt = current?.maintenanceStartedAt;

      if (startedAt) {
        const now = new Date();
        const elapsedMs = now.getTime() - new Date(startedAt).getTime();

        if (elapsedMs > 0) {
          // Only extend keys for this exact game code + registrator
          // that were active (not yet expired) when maintenance started
          const keyFilter: Record<string, unknown> = {
            game: gameCode.toUpperCase(),
            expiredDate: { $ne: null, $gte: new Date(startedAt) },
          };
          if (registrator) keyFilter.registrator = registrator;

          await Key.updateMany(
            keyFilter,
            [{ $set: { expiredDate: { $add: ['$expiredDate', elapsedMs] } } }],
            { updatePipeline: true } as any
          );
        }
      }

      // Clear the recorded start time
      updateData.maintenanceStartedAt = null;
    }
  }
  // ─────────────────────────────────────────────────────────────────────────

  const game = await GameSetting.findOneAndUpdate(
    filter,
    { $set: updateData },
    { returnDocument: 'after', strict: false }
  ).lean();
  clearConfigCache();
  return game ? { ...game, _id: game._id.toString() } : null;
}

export async function deleteGameSetting(gameCode: string, registrator?: string) {
  await dbConnect();
  const filter: Record<string, unknown> = { gameCode: gameCode.toUpperCase() };
  if (registrator) filter.registrator = registrator;
  const result = await GameSetting.deleteOne(filter);
  clearConfigCache();
  return result.deletedCount > 0;
}