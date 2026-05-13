import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connection';
import Key from '@/lib/db/models/Key';

export const dynamic = 'force-dynamic';

/**
 * GET /api/keys/expiring
 * Returns keys for the authenticated registrator that expire within
 * the given number of hours (default 24).
 */
export async function GET(request: NextRequest) {
  const registrator = request.headers.get('x-username');
  const userLevel = request.headers.get('x-user-level');

  if (!registrator) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const hours = parseInt(searchParams.get('hours') || '24', 10);
  const maxHours = Math.min(hours, 168); // Cap at 7 days

  try {
    await dbConnect();
    const now = new Date();
    const cutoff = new Date(now.getTime() + maxHours * 60 * 60 * 1000);

    const filter: Record<string, unknown> = {
      status: 1,
      expiredDate: { $gte: now, $lte: cutoff },
    };

    // Non-owners only see their own keys
    if (userLevel !== '1') {
      filter.registrator = registrator;
    }

    const keys = await Key.find(filter)
      .sort({ expiredDate: 1 })
      .limit(20)
      .lean();

    return NextResponse.json({
      success: true,
      data: keys.map((k) => ({
        _id: k._id.toString(),
        game: k.game,
        userKey: k.userKey,
        expiredDate: k.expiredDate instanceof Date ? k.expiredDate.toISOString() : k.expiredDate,
        maxDevices: k.maxDevices,
        devices: k.devices,
        registrator: k.registrator,
        isFreeKey: k.isFreeKey,
      })),
    });
  } catch (error) {
    console.error('Expiring keys error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
