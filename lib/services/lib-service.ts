import dbConnect from '@/lib/db/connection';
import Lib from '@/lib/db/models/Lib';
import { uploadToFtp, deleteFromFtp } from '@/lib/ftp/client';
import { Readable } from 'stream';
import { randomBytes } from 'crypto';

function sanitize(lib: any) {
  const { ftpUrl, ...rest } = lib.toObject ? lib.toObject() : lib;
  return { ...rest, _id: rest._id.toString(), uploadedAt: rest.uploadedAt?.toISOString() };
}

function makeUniqueName(fileName: string): string {
  const suffix = randomBytes(4).toString('hex');
  const dotIndex = fileName.lastIndexOf('.');
  if (dotIndex === -1) return `${fileName}_${suffix}`;
  return `${fileName.slice(0, dotIndex)}_${suffix}${fileName.slice(dotIndex)}`;
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

export async function uploadLib(fileName: string, fileSize: string, stream: Readable, uploadedBy: string) {
  await dbConnect();

  let storedName = fileName;
  const existing = await Lib.findOne({ fileName: storedName }).lean();
  if (existing) {
    storedName = makeUniqueName(fileName);
  }

  const ftpUrl = await uploadToFtp(storedName, stream);
  const lib = await Lib.create({
    fileName: storedName,
    displayName: fileName,
    ftpUrl,
    fileSize,
    uploadedBy,
  });
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