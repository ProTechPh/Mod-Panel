import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connection';
import Key from '@/lib/db/models/Key';
import { withApi } from '@/lib/api/with-api';

export const dynamic = 'force-dynamic';

/**
 * GET /api/keys/expiring
 * Returns keys for the authenticated registrator that expire within
 * the given number of hours (default 24).
 */
export const GET = withApi(async (request, user) => {
  const searchParams = request.nextUrl.searchParams;
  const hours = parseInt(searchParams.get('hours') || '24', 10);
  const maxHours = Math.min(hours, 168); // Cap at 7 days

  await dbConnect();
  const now = new Date();
  const cutoff = new Date(now.getTime() + maxHours * 60 * 60 * 1000);

  const filter: Record<string, unknown> = {
    status: 1,
    expiredDate: { $gte: now, $lte: cutoff },
  };

  // Non-owners only see their own keys
  if (user.level !== 1) {
    filter.registrator = user.username;
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
});
