import dbConnect from '@/lib/db/connection';
import ServerConfig, { SingletonId } from '@/lib/db/models/ServerConfig';
import { clearConfigCache } from './key-service';
import type { MaintenanceStatus } from '@/types';

export async function getServerConfig() {
  await dbConnect();
  let config = await ServerConfig.findById(SingletonId).lean();
  if (!config) {
    config = await ServerConfig.create({
      _id: SingletonId,
      modName: '',
      maintenanceStatus: 'off',
      maintenanceMessage: '',
      telegramChannel: '',
      telegramGroup: '',
    });
  }
  return { ...config, _id: config._id.toString() };
}

export async function updateServerConfig(data: {
  modName?: string;
  maintenanceStatus?: MaintenanceStatus;
  maintenanceMessage?: string;
  telegramChannel?: string;
  telegramGroup?: string;
}) {
  await dbConnect();

  const update: Record<string, unknown> = {};
  if (data.modName !== undefined) update.modName = data.modName;
  if (data.maintenanceStatus !== undefined) update.maintenanceStatus = data.maintenanceStatus;
  if (data.maintenanceMessage !== undefined) update.maintenanceMessage = data.maintenanceMessage;
  if (data.telegramChannel !== undefined) update.telegramChannel = data.telegramChannel;
  if (data.telegramGroup !== undefined) update.telegramGroup = data.telegramGroup;

  const config = await ServerConfig.findByIdAndUpdate(SingletonId, update, { new: true }).lean();
  clearConfigCache();
  return config ? { ...config, _id: config._id.toString() } : null;
}
