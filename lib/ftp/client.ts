import * as ftp from 'basic-ftp';
import { Readable, PassThrough } from 'stream';
import dbConnect from '@/lib/db/connection';
import FtpConfig from '@/lib/db/models/FtpConfig';

export interface FtpServerConfig {
  host: string;
  user: string;
  password: string;
  port: number;
  scanPaths: string[];
}

export interface FtpStats {
  totalFiles: number;
  totalDirs: number;
  totalSizeBytes: number;
  inodesUsed: number;
}

const ENV_CONFIG: FtpServerConfig = {
  host: process.env.FTP_HOSTNAME || 'ftpupload.net',
  user: process.env.FTP_USERNAME || '',
  password: process.env.FTP_PASSWORD || '',
  port: parseInt(process.env.FTP_PORT || '21', 10),
  scanPaths: ['/htdocs/'],
};

export async function getFtpConfigs(): Promise<FtpServerConfig[]> {
  try {
    await dbConnect();
    const fromDb = await FtpConfig.find({ isActive: true }).sort({ order: 1 }).lean();
    if (fromDb.length > 0) {
      return fromDb.map(c => ({
        host: c.host,
        user: c.user,
        password: c.password,
        port: c.port,
        scanPaths: (() => {
          const raw = [c.remotePath, ...(c.scanPaths || [])].filter(Boolean);
          return raw.filter((p, i) => !raw.some((o, j) => i !== j && p.startsWith(o)));
        })(),
      }));
    }
  } catch { /* DB unavailable */ }
  return [ENV_CONFIG];
}

export async function getFtpConfigById(id: string) {
  try {
    await dbConnect();
    return await FtpConfig.findById(id).lean();
  } catch { return null; }
}

async function scanFtp(config: FtpServerConfig): Promise<FtpStats> {
  const client = new ftp.Client(30000);
  try {
    await client.access({ host: config.host, user: config.user, password: config.password, port: config.port });

    async function walk(dir: string): Promise<{ files: number; dirs: number; size: number }> {
      let files = 0, dirs = 0, size = 0;
      try {
        const list = await client.list(dir);
        for (const item of list) {
          if (item.name === '.' || item.name === '..') continue;
          if (item.isDirectory) {
            dirs++;
            const sub = await walk(`${dir}${item.name}/`);
            files += sub.files; dirs += sub.dirs; size += sub.size;
          } else {
            files++; size += item.size;
          }
        }
      } catch { /* skip */ }
      return { files, dirs, size };
    }

    let totalFiles = 0, totalDirs = 0, totalSize = 0;
    for (const p of config.scanPaths) {
      try {
        const s = await walk(p.endsWith('/') ? p : p + '/');
        totalFiles += s.files; totalDirs += s.dirs; totalSize += s.size;
      } catch { /* skip */ }
    }
    return { totalFiles, totalDirs, totalSizeBytes: totalSize, inodesUsed: totalFiles + totalDirs };
  } finally {
    client.close();
  }
}

export async function getAllFtpStats(): Promise<FtpStats> {
  const configs = await getFtpConfigs();
  const results = await Promise.allSettled(configs.map(scanFtp));
  let totalFiles = 0, totalDirs = 0, totalSize = 0;
  for (const r of results) {
    if (r.status === 'fulfilled') {
      totalFiles += r.value.totalFiles;
      totalDirs += r.value.totalDirs;
      totalSize += r.value.totalSizeBytes;
    }
  }
  return { totalFiles, totalDirs, totalSizeBytes: totalSize, inodesUsed: totalFiles + totalDirs };
}

async function resolveConfig(ftpConfigId?: string) {
  if (ftpConfigId) {
    const cfg = await getFtpConfigById(ftpConfigId);
    if (cfg) return cfg;
  }
  // fallback: first active config, then env
  try {
    await dbConnect();
    const anyCfg = await FtpConfig.findOne({ isActive: true }).sort({ order: 1 }).lean();
    if (anyCfg) return anyCfg;
  } catch { /* skip */ }
  return null;
}

export async function uploadToFtp(fileName: string, stream: Readable | string, ftpConfigId?: string): Promise<string> {
  const cfg = await resolveConfig(ftpConfigId);
  const host = cfg?.host || ENV_CONFIG.host;
  const user = cfg?.user || ENV_CONFIG.user;
  const password = cfg?.password || ENV_CONFIG.password;
  const port = cfg?.port || ENV_CONFIG.port;
  const remotePath = cfg?.remotePath || '/htdocs/onlinelibs/';
  const baseUrl = `ftp://${host}${remotePath}`;

  const client = new ftp.Client(60000);
  client.ftp.socket.setKeepAlive(true);
  try {
    await client.access({ host, user, password, port });
    await client.ensureDir(remotePath);
    client.trackProgress(() => {});
    await client.uploadFrom(stream, `${remotePath}${fileName}`);
    client.trackProgress();
    return `${baseUrl}${fileName}`;
  } finally {
    client.close();
  }
}

export async function deleteFromFtp(fileName: string, ftpConfigId?: string): Promise<void> {
  const cfg = await resolveConfig(ftpConfigId);
  const host = cfg?.host || ENV_CONFIG.host;
  const user = cfg?.user || ENV_CONFIG.user;
  const password = cfg?.password || ENV_CONFIG.password;
  const port = cfg?.port || ENV_CONFIG.port;
  const remotePath = cfg?.remotePath || '/htdocs/onlinelibs/';

  const client = new ftp.Client(15000);
  try {
    await client.access({ host, user, password, port });
    await client.remove(`${remotePath}${fileName}`);
  } finally {
    client.close();
  }
}

export async function downloadFromFtp(fileName: string, ftpConfigId?: string): Promise<Readable> {
  const cfg = await resolveConfig(ftpConfigId);
  const host = cfg?.host || ENV_CONFIG.host;
  const user = cfg?.user || ENV_CONFIG.user;
  const password = cfg?.password || ENV_CONFIG.password;
  const port = cfg?.port || ENV_CONFIG.port;
  const remotePath = cfg?.remotePath || '/htdocs/onlinelibs/';

  const client = new ftp.Client(10000);
  client.ftp.socket.setKeepAlive(true);
  try {
    await client.access({ host, user, password, port });
    const fullPath = `${remotePath}${fileName}`;

    const passthrough = new PassThrough();
    client.downloadTo(passthrough, fullPath)
      .then(() => passthrough.end())
      .catch(err => passthrough.destroy(err))
      .finally(() => client.close());
    return passthrough;
  } catch (err) {
    client.close();
    throw err;
  }
}
