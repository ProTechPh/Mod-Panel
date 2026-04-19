import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth/middleware';
import { listReferrals, createReferral, deleteReferral, updateReferral } from '@/lib/services/referral-service';

export async function GET(request: NextRequest) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const referrals = await listReferrals(user.level === 1 ? undefined : user.username);
  return NextResponse.json(referrals);
}

export async function POST(request: NextRequest) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (user.level !== 1 && user.level !== 2) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
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
  } catch (error) {
    console.error('Referral create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
