import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connection';
import Key from '@/lib/db/models/Key';
import { Logger } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const NOTIFICATION_WINDOWS = [
  { label: '24 hours', hours: 24 },
  { label: '7 days', hours: 7 * 24 },
];

/**
 * Cron endpoint that checks for keys expiring soon.
 * Telegram bot notifications are disabled. In-app banner is used instead.
 *
 * Call with ?secret=YOUR_SECRET or Authorization: Bearer YOUR_SECRET
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const secret = request.nextUrl.searchParams.get('secret');
  const CRON_SECRET = process.env.CRON_SECRET;

  if (!CRON_SECRET || (authHeader !== `Bearer ${CRON_SECRET}` && secret !== CRON_SECRET)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();
  const now = new Date();
  const results: { window: string; expiring: number }[] = [];

  for (const window of NOTIFICATION_WINDOWS) {
    const windowEnd = new Date(now.getTime() + window.hours * 60 * 60 * 1000);
    const windowStart = new Date(windowEnd.getTime() - 60 * 60 * 1000);

    const expiringKeys = await Key.find({
      status: 1,
      expiredDate: { $gte: windowStart, $lte: windowEnd },
    }).lean();

    results.push({ window: window.label, expiring: expiringKeys.length });
    Logger.info(`[Cron] Key expiry ${window.label}: ${expiringKeys.length} keys expiring`);
  }

  return NextResponse.json({
    success: true,
    message: 'Telegram bot is disabled. Use the in-app dashboard banner for expiry notifications.',
    results,
  });
}
