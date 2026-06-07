import { NextRequest, NextResponse } from 'next/server';
import { expireStalePendingOrders, deleteOrdersByStatus } from '@/lib/services/store-service';
import { Logger } from '@/lib/utils';

export const dynamic = 'force-dynamic';

/**
 * Cron endpoint for store order cleanup.
 *
 * Actions:
 *   1. Expire pending orders older than 30 minutes
 *   2. Delete expired orders older than 24 hours
 *   3. Delete failed orders older than 7 days
 *
 * Call with ?secret=YOUR_SECRET or Authorization: Bearer YOUR_SECRET
 * Recommended cron schedule: every 5 minutes
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const secret = request.nextUrl.searchParams.get('secret');
  const CRON_SECRET = process.env.CRON_SECRET;

  if (!CRON_SECRET || (authHeader !== `Bearer ${CRON_SECRET}` && secret !== CRON_SECRET)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const expired = await expireStalePendingOrders(30);
    Logger.info(`[Cron] Store cleanup: ${expired} pending orders marked as expired`);

    const deletedExpired = await deleteOrdersByStatus('expired', 1440);
    Logger.info(`[Cron] Store cleanup: ${deletedExpired} expired orders deleted`);

    const deletedFailed = await deleteOrdersByStatus('failed', 10080);
    Logger.info(`[Cron] Store cleanup: ${deletedFailed} failed orders deleted`);

    return NextResponse.json({
      success: true,
      expired,
      deletedExpired,
      deletedFailed,
    });
  } catch (error) {
    Logger.error('Store cleanup cron error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
