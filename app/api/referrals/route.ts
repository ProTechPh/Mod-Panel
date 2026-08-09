import { NextResponse } from 'next/server';
import { withApi } from '@/lib/api/with-api';
import { listReferrals, createReferral } from '@/lib/services/referral-service';

export const GET = withApi(async (request, user) => {
  const referrals = await listReferrals(user.level === 1 ? undefined : user.username);
  return NextResponse.json(referrals);
});

export const POST = withApi(async (request, user) => {
  if (user.level !== 1 && user.level !== 2) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const body = await request.json();
  const { level, setSaldo, accExpirationDays } = body;

  if (level === undefined || setSaldo === undefined || accExpirationDays === undefined) {
    return NextResponse.json({ error: 'Level, setSaldo, and accExpirationDays are required' }, { status: 400 });
  }

  const referral = await createReferral(
    user.username,
    level,
    setSaldo,
    accExpirationDays
  );

  return NextResponse.json(referral, { status: 201 });
});
