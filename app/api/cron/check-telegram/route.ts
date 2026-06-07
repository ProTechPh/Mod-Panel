import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connection';
import User from '@/lib/db/models/User';
import { STATUS_BANNED } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Basic security check
  // You can call this URL with ?secret=YOUR_SECRET or an Authorization header
  const authHeader = request.headers.get('authorization');
  const searchParams = request.nextUrl.searchParams;
  const secret = searchParams.get('secret');
  
  const CRON_SECRET = process.env.CRON_SECRET;

  if (!CRON_SECRET || (authHeader !== `Bearer ${CRON_SECRET}` && secret !== CRON_SECRET)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();

  try {
    const result = await User.updateMany(
      { 
        level: { $ne: 1 }, // Don't ban Level 1 Admins (Owners)
        telegramId: { $in: [null, undefined] },
        status: { $ne: STATUS_BANNED }
      },
      { 
        $set: { 
          status: STATUS_BANNED,
          banReason: 'No connected Telegram account. Contact @CanKillYouForever to appeal.'
        } 
      }
    );

    console.log(`[Cron] Banned ${result.modifiedCount} users without Telegram.`);

    return NextResponse.json({ 
      success: true, 
      message: `Process completed. ${result.modifiedCount} users were banned.`,
      count: result.modifiedCount
    });
  } catch (error) {
    console.error('[Cron] Telegram check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
