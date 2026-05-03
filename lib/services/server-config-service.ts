import dbConnect from '@/lib/db/connection';
import ServerConfig, { SingletonId } from '@/lib/db/models/ServerConfig';
import Key from '@/lib/db/models/Key';
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
      maintenanceStartedAt: null,
      announcement: '',
      announcementStatus: 'off',
      telegramChannel: '',
      telegramGroup: '',
    });
  }
  return {
    modName: config.modName || '',
    maintenanceStatus: config.maintenanceStatus || 'off',
    maintenanceMessage: config.maintenanceMessage || '',
    maintenanceStartedAt: config.maintenanceStartedAt || null,
    announcement: config.announcement || '',
    announcementStatus: config.announcementStatus || 'off',
    telegramChannel: config.telegramChannel || '',
    telegramGroup: config.telegramGroup || '',
    _id: config._id.toString(),
  };
}

export async function updateServerConfig(data: {
  modName?: string;
  maintenanceStatus?: MaintenanceStatus;
  maintenanceMessage?: string;
  announcement?: string;
  announcementStatus?: 'on' | 'off';
  telegramChannel?: string;
  telegramGroup?: string;
}) {
  await dbConnect();

  const update: Record<string, unknown> = {};
  if (data.modName !== undefined) update.modName = data.modName;
  if (data.maintenanceMessage !== undefined) update.maintenanceMessage = data.maintenanceMessage;
  if (data.announcement !== undefined) update.announcement = data.announcement;
  if (data.announcementStatus !== undefined) update.announcementStatus = data.announcementStatus;
  if (data.telegramChannel !== undefined) update.telegramChannel = data.telegramChannel;
  if (data.telegramGroup !== undefined) update.telegramGroup = data.telegramGroup;

  // ── Maintenance timer pause / resume ─────────────────────────────────────
  if (data.maintenanceStatus !== undefined) {
    update.maintenanceStatus = data.maintenanceStatus;

    if (data.maintenanceStatus === 'on') {
      // Record when maintenance started so we can compensate later
      update.maintenanceStartedAt = new Date();

    } else {
      // Maintenance ended — extend all active keys by the elapsed duration
      const current = await ServerConfig.findById(SingletonId).lean();
      const startedAt = current?.maintenanceStartedAt;

      if (startedAt) {
        const now = new Date();
        const elapsedMs = now.getTime() - new Date(startedAt).getTime();

        if (elapsedMs > 0) {
          // Extend expiredDate of every key that:
          //   1. Has already been activated (expiredDate is not null)
          //   2. Was not expired BEFORE maintenance started (expiredDate >= startedAt)
          await Key.updateMany(
            {
              expiredDate: { $ne: null, $gte: new Date(startedAt) },
            },
            [
              {
                $set: {
                  expiredDate: {
                    $add: ['$expiredDate', elapsedMs],
                  },
                },
              },
            ],
            { updatePipeline: true }
          );
        }
      }

      // Clear the recorded start time
      update.maintenanceStartedAt = null;
    }
  }
  // ─────────────────────────────────────────────────────────────────────────

  const config = await ServerConfig.findByIdAndUpdate(SingletonId, update, { returnDocument: 'after' }).lean();
  clearConfigCache();
  return config ? { ...config, _id: config._id.toString() } : null;
}

