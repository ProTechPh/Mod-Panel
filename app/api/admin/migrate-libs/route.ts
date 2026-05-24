import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connection';
import FtpConfig from '@/lib/db/models/FtpConfig';
import Lib from '@/lib/db/models/Lib';
import { authenticate } from '@/lib/auth/middleware';

export async function POST(request: NextRequest) {
  const user = await authenticate(request);
  if (!user || user.level !== 1) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await dbConnect();
    const firstCfg = await FtpConfig.findOne({ isActive: true }).sort({ order: 1 }).lean();
    if (!firstCfg) return NextResponse.json({ error: 'No active FTP config found' }, { status: 400 });

    const cfgId = firstCfg._id.toString();
    const result = await Lib.updateMany(
      { ftpConfigId: { $exists: false } },
      { $set: { ftpConfigId: cfgId } }
    );

    return NextResponse.json({
      matched: result.matchedCount,
      modified: result.modifiedCount,
      ftpConfigId: cfgId,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
