import dbConnect from '@/lib/db/connection';
import Lib from '@/lib/db/models/Lib';
import { uploadToFtp, deleteFromFtp } from '@/lib/ftp/client';
import { Readable } from 'stream';

function sanitize(lib: any) {
  const { ftpUrl, ...rest } = lib.toObject ? lib.toObject() : lib;
  return { ...rest, _id: rest._id.toString(), uploadedAt: rest.uploadedAt?.toISOString() };
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

export async function uploadLib(fileName: string, fileSize: string, fileSizeBytes: number, stream: Readable, uploadedBy: string, uploaderLevel: number = 2, libType: string = 'free') {
  await dbConnect();

  const existing = await Lib.findOne({ fileName }).lean();

  if (existing) {
    // Only the original uploader OR level 1 admin can replace
    if (existing.uploadedBy !== uploadedBy && uploaderLevel !== 1) {
      const error: any = new Error(`This file was uploaded by @${existing.uploadedBy}. You cannot replace it.`);
      error.code = 'FORBIDDEN_REPLACE';
      throw error;
    }

    // Authorized — delete old file from FTP first
    try {
      await deleteFromFtp(fileName);
    } catch {
      // FTP file may already be gone, continue anyway
    }
  }

  const ftpUrl = await uploadToFtp(fileName, stream);

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

export async function deleteLib(id: string) {
  await dbConnect();
  const lib = await Lib.findById(id).lean();
  if (!lib) return false;

  try {
    await deleteFromFtp(lib.fileName);
  } catch {
    // FTP delete may fail if file already removed; continue with DB delete
  }

  await Lib.deleteOne({ _id: id });
  return true;
}