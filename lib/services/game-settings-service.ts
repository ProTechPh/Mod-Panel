import dbConnect from '@/lib/db/connection';
import GameSetting from '@/lib/db/models/GameSetting';
import Key from '@/lib/db/models/Key';
import { toIsoString } from '@/lib/utils/dates';
import type { GameSettingDoc } from '@/types';
import { clearConfigCache } from './key-service';

function serializeGameSetting(g: GameSettingDoc) {
  return {
    ...g,
    _id: g._id.toString(),
    createdAt: toIsoString(g.createdAt),
    updatedAt: toIsoString(g.updatedAt),
    maintenanceStartedAt: toIsoString(g.maintenanceStartedAt),
  };
}

export async function listGameSettings(registrator?: string) {
  await dbConnect();
  const filter = registrator ? { registrator } : {};
  const games = await GameSetting.find(filter).sort({ gameCode: 1 }).lean();
  return games.map(serializeGameSetting);
}

export async function getGameSetting(gameCode: string, registrator?: string) {
  await dbConnect();
  const filter: Record<string, unknown> = { gameCode: gameCode.toUpperCase() };
  if (registrator) filter.registrator = registrator;
  const game = await GameSetting.findOne(filter).lean();
  if (!game) return null;
  return serializeGameSetting(game);
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
    modName: '',
    announcement: '',
    announcementStatus: 'off',
  });
  clearConfigCache();
  return serializeGameSetting(game.toObject());
}

export async function updateGameSetting(gameCode: string, data: {
  gameName?: string;
  isEnabled?: boolean;
  connectEnabled?: boolean;
  freeKeyEnabled?: boolean;
  maintenanceMessage?: string;
  downloadLink?: string;
  modName?: string;
}, registrator?: string) {
  await dbConnect();
  const filter: Record<string, unknown> = { gameCode: gameCode.toUpperCase() };
  if (registrator) filter.registrator = registrator;

  // Strip non-schema fields before update
  const updateData: Record<string, unknown> = {
    ...(data.gameName !== undefined && { gameName: data.gameName }),
    ...(data.isEnabled !== undefined && { isEnabled: data.isEnabled }),
    ...(data.connectEnabled !== undefined && { connectEnabled: data.connectEnabled }),
    ...(data.freeKeyEnabled !== undefined && { freeKeyEnabled: data.freeKeyEnabled }),
    ...(data.maintenanceMessage !== undefined && { maintenanceMessage: data.maintenanceMessage }),
    ...(data.downloadLink !== undefined && { downloadLink: data.downloadLink }),
    ...(data.modName !== undefined && { modName: data.modName }),
  };

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
            { updatePipeline: true }
          );
        }
      }

      // Clear the recorded start time
      updateData.maintenanceStartedAt = null;
    }
  }
  // ─────────────────────────────────────────────────────────────────────────

  const updateOps: Record<string, unknown> = { $set: updateData };

  const game = await GameSetting.findOneAndUpdate(
    filter,
    updateOps,
    { returnDocument: 'after', strict: false }
  ).lean();
  clearConfigCache();
  return game ? serializeGameSetting(game) : null;
}

export async function deleteGameSetting(gameCode: string, registrator?: string) {
  await dbConnect();
  const filter: Record<string, unknown> = { gameCode: gameCode.toUpperCase() };
  if (registrator) filter.registrator = registrator;
  const result = await GameSetting.deleteOne(filter);
  clearConfigCache();
  return result.deletedCount > 0;
}