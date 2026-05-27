import dbConnect from '@/lib/db/connection';
import Lib from '@/lib/db/models/Lib';
import LibraryLog from '@/lib/db/models/LibraryLog';
import FtpConfig from '@/lib/db/models/FtpConfig';
import { uploadToFtp, deleteFromFtp } from '@/lib/ftp/client';
import { Readable } from 'stream';

function sanitize(lib: any) {
  const { ftpUrl, ...rest } = lib.toObject ? lib.toObject() : lib;
  return { ...rest, _id: rest._id.toString(), uploadedAt: rest.uploadedAt?.toISOString() };
}

export async function resolveFtpConfigId(ftpConfigId?: string): Promise<string | undefined> {
  if (ftpConfigId) return ftpConfigId;
  await dbConnect();
  const active = await FtpConfig.find({ isActive: true }).sort({ order: 1 }).lean();
  if (active.length === 0) return undefined;
  if (active.length === 1) return active[0]._id.toString();

  // Pick the FTP config with the fewest libs (least-used distribution)
  const counts = await Promise.all(active.map(c =>
    Lib.countDocuments({ ftpConfigId: c._id.toString() })
  ));
  const minCount = Math.min(...counts);
  const candidates = active.filter((_, i) => counts[i] === minCount);
  const picked = candidates[Math.floor(Math.random() * candidates.length)];
  return picked._id.toString();
}

export async function listLibs(registrator?: string) {
  await dbConnect();
  const filter = registrator ? { uploadedBy: registrator } : {};
  const libs = await Lib.find(filter).sort({ uploadedAt: -1 }).lean();
  return libs.map(l => sanitize(l));
}

export async function getLib(id: string) {
  await dbConnect();
  const lib = await Lib.findById(id).lean();
  if (!lib) return null;
  return sanitize(lib);
}

export async function uploadLib(fileName: string, fileSize: string, fileSizeBytes: number, stream: Readable, uploadedBy: string, uploaderLevel: number = 2, libType: string = 'free', ftpConfigId?: string) {
  await dbConnect();

  const resolvedId = await resolveFtpConfigId(ftpConfigId);

  const existing = await Lib.findOne({ fileName }).lean();

  if (existing) {
    if (existing.uploadedBy !== uploadedBy && uploaderLevel !== 1) {
      const error: any = new Error(`This file was uploaded by @${existing.uploadedBy}. You cannot replace it.`);
      error.code = 'FORBIDDEN_REPLACE';
      throw error;
    }

    try {
      await deleteFromFtp(fileName, existing.ftpConfigId || resolvedId);
    } catch {
      // FTP file may already be gone, continue anyway
    }
  }

  const ftpUrl = await uploadToFtp(fileName, stream, resolvedId);

  const lib = await Lib.findOneAndUpdate(
    { fileName },
    {
      fileName,
      displayName: fileName,
      type: libType === 'paid' ? 'paid' : 'free',
      ftpUrl,
      fileSize,
      fileSizeBytes,
      uploadedBy,
      uploadedAt: new Date(),
      ftpConfigId: resolvedId,
    },
    { upsert: true, returnDocument: 'after' }
  );

  return sanitize(lib);
}


export async function updateLib(id: string, updates: { displayName?: string; type?: string }) {
  await dbConnect();
  const setData: Record<string, any> = {};
  if (updates.displayName !== undefined) setData.displayName = updates.displayName;
  if (updates.type !== undefined) setData.type = updates.type === 'paid' ? 'paid' : 'free';
  if (Object.keys(setData).length === 0) return getLib(id);
  const lib = await Lib.findByIdAndUpdate(id, { $set: setData }, { returnDocument: 'after' }).lean();
  if (!lib) return null;
  return sanitize(lib);
}

export async function logLibDownload(libId: string, fileName: string, uploadedBy: string, ipAddress: string, userAgent: string) {
  await dbConnect();
  const device = parseDevice(userAgent);
  await LibraryLog.create({ libId, fileName, uploadedBy, ipAddress, userAgent, device, downloadedAt: new Date() });
}

function parseDevice(ua: string): string {
  if (!ua) return 'Unknown';
  const u = ua.toLowerCase();
  if (u.includes('windows')) return 'Windows';
  if (u.includes('mac os') || u.includes('macintosh')) return 'macOS';
  if (u.includes('linux') || u.includes('android')) return 'Android';
  if (u.includes('iphone') || u.includes('ipad')) return 'iOS';
  if (u.includes('okhttp')) return 'Android (OKHttp)';
  if (u.includes('dalvik')) return 'Android (Dalvik)';
  return 'Other';
}

export async function getLibLogs(libId: string, username?: string) {
  await dbConnect();
  const filter: Record<string, any> = { libId };
  if (username) filter.uploadedBy = username;
  const logs = await LibraryLog.find(filter).sort({ downloadedAt: -1 }).limit(100).lean();
  return logs.map(l => ({ ...l, _id: l._id.toString(), libId: l.libId.toString(), downloadedAt: l.downloadedAt?.toISOString() }));
}

export async function getRecentLibLogs(username?: string, limit: number = 15) {
  await dbConnect();
  const filter: Record<string, any> = {};
  if (username) filter.uploadedBy = username;
  const logs = await LibraryLog.find(filter).sort({ downloadedAt: -1 }).limit(limit).lean();
  return logs.map(l => ({ ...l, _id: l._id.toString(), libId: l.libId.toString(), downloadedAt: l.downloadedAt?.toISOString() }));
}

export async function deleteLib(id: string) {
  await dbConnect();
  const lib = await Lib.findById(id).lean();
  if (!lib) return false;

  try {
    await deleteFromFtp(lib.fileName, lib.ftpConfigId);
  } catch {
    // FTP delete may fail if file already removed; continue with DB delete
  }

  await Lib.deleteOne({ _id: id });
  return true;
}