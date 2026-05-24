import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connection';
import FtpConfig from '@/lib/db/models/FtpConfig';
import Lib from '@/lib/db/models/Lib';
import { authenticate } from '@/lib/auth/middleware';
import * as ftp from 'basic-ftp';
import { PassThrough } from 'stream';

export async function POST(request: NextRequest) {
  const user = await authenticate(request);
  if (!user || user.level !== 1) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await dbConnect();
    const cfg = await FtpConfig.findOne({ isActive: true, isLibStorage: true }).lean();
    if (!cfg) return NextResponse.json({ error: 'No lib FTP config found' }, { status: 400 });

    const oldPath = '/htdocs/onlinelibs/';
    const newPath = '/mod.kesug.com/htdocs/onlinelibs/';

    const libs = await Lib.find({}).lean();
    const results: { fileName: string; status: string; error?: string }[] = [];

    const client = new ftp.Client(60000);
    client.ftp.socket.setKeepAlive(true);
    await client.access({
      host: cfg.host,
      user: cfg.user,
      password: cfg.password,
      port: cfg.port,
    });

    try {
      await client.ensureDir(newPath);

      for (const lib of libs) {
        const fn = lib.fileName;
        try {
          let oldSize: number;
          try { oldSize = await client.size(oldPath + fn); } catch {
            results.push({ fileName: fn, status: 'skipped', error: 'Not found in old path' });
            continue;
          }

          try {
            await client.size(newPath + fn);
            results.push({ fileName: fn, status: 'skipped', error: 'Already exists in new path' });
            continue;
          } catch { /* proceed */ }

          const chunks: Buffer[] = [];
          const ws = new PassThrough();
          ws.on('data', (c: Buffer) => chunks.push(c));

          const done = new Promise<void>((resolve, reject) => {
            ws.on('end', () => resolve());
            ws.on('error', (e) => reject(e));
          });

          await client.downloadTo(ws, oldPath + fn);
          await done;

          await client.uploadFrom(Buffer.concat(chunks), newPath + fn);
          results.push({ fileName: fn, status: 'copied', size: oldSize });
        } catch (err: any) {
          results.push({ fileName: fn, status: 'error', error: err.message });
        }
      }

      await FtpConfig.findByIdAndUpdate(cfg._id, {
        $set: {
          remotePath: newPath,
          libBaseUrl: 'https://mod.kesug.com/onlinelibs',
        },
      });
    } finally {
      client.close();
    }

    return NextResponse.json({
      copied: results.filter(r => r.status === 'copied').length,
      skipped: results.filter(r => r.status === 'skipped').length,
      errors: results.filter(r => r.status === 'error').length,
      results,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
