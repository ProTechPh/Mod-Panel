import * as ftp from 'basic-ftp';
import { Readable, PassThrough } from 'stream';

const FTP_HOST = process.env.FTP_HOSTNAME || '';
const FTP_USER = process.env.FTP_USERNAME || '';
const FTP_PASS = process.env.FTP_PASSWORD || '';
const FTP_PORT = parseInt(process.env.FTP_PORT || '21', 10);
const FTP_REMOTE_PATH = process.env.FTP_REMOTE_PATH || '/htdocs/';

export interface FtpStats {
  totalFiles: number;
  totalDirs: number;
  totalSizeBytes: number;
  inodesUsed: number;
}

export async function getFtpStats(): Promise<FtpStats> {
  const client = new ftp.Client(30000);
  try {
    await client.access({ host: FTP_HOST, user: FTP_USER, password: FTP_PASS, port: FTP_PORT });

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

    const scanPath = FTP_REMOTE_PATH.endsWith('/') ? FTP_REMOTE_PATH : FTP_REMOTE_PATH + '/';
    const s = await walk(scanPath);
    return { totalFiles: s.files, totalDirs: s.dirs, totalSizeBytes: s.size, inodesUsed: s.files + s.dirs };
  } finally {
    client.close();
  }
}

export async function uploadToFtp(fileName: string, stream: Readable | string): Promise<string> {
  const baseUrl = `ftp://${FTP_HOST}${FTP_REMOTE_PATH}`;

  const client = new ftp.Client(60000);
  client.ftp.socket.setKeepAlive(true);
  try {
    await client.access({ host: FTP_HOST, user: FTP_USER, password: FTP_PASS, port: FTP_PORT });
    await client.ensureDir(FTP_REMOTE_PATH);
    client.trackProgress(() => {});
    await client.uploadFrom(stream, `${FTP_REMOTE_PATH}${fileName}`);
    client.trackProgress();
    return `${baseUrl}${fileName}`;
  } finally {
    client.close();
  }
}

export async function deleteFromFtp(fileName: string): Promise<void> {
  const client = new ftp.Client(15000);
  try {
    await client.access({ host: FTP_HOST, user: FTP_USER, password: FTP_PASS, port: FTP_PORT });
    await client.remove(`${FTP_REMOTE_PATH}${fileName}`);
  } finally {
    client.close();
  }
}

export async function downloadFromFtp(fileName: string): Promise<Readable> {
  const client = new ftp.Client(10000);
  client.ftp.socket.setKeepAlive(true);
  try {
    await client.access({ host: FTP_HOST, user: FTP_USER, password: FTP_PASS, port: FTP_PORT });
    const fullPath = `${FTP_REMOTE_PATH}${fileName}`;

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
