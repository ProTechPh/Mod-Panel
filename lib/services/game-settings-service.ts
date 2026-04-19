import dbConnect from '@/lib/db/connection';
import GameSetting from '@/lib/db/models/GameSetting';
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
  features?: Record<string, boolean>;
}, registrator?: string) {
  await dbConnect();
  const filter: Record<string, unknown> = { gameCode: gameCode.toUpperCase() };
  if (registrator) filter.registrator = registrator;
  const game = await GameSetting.findOneAndUpdate(
    filter,
    data,
    { new: true }
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