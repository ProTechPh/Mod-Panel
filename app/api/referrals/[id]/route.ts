import { NextResponse } from 'next/server';
import { withApi } from '@/lib/api/with-api';
import { updateReferral, deleteReferral } from '@/lib/services/referral-service';

export const PUT = withApi(async (request, user, { id }: { id: string }) => {
  if (!id) return NextResponse.json({ error: 'Referral ID required' }, { status: 400 });

  const body = await request.json();
  const { level, setSaldo, accExpirationDays } = body;

  if (level === undefined && setSaldo === undefined && accExpirationDays === undefined) {
    return NextResponse.json({ error: 'At least one field required' }, { status: 400 });
  }

  const updated = await updateReferral(id, { level, setSaldo, accExpirationDays });
  if (!updated) return NextResponse.json({ error: 'Referral not found' }, { status: 404 });

  return NextResponse.json(updated);
});

export const DELETE = withApi(async (request, user, { id }: { id: string }) => {
  if (user.level !== 1 && user.level !== 2) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  if (!id) return NextResponse.json({ error: 'Referral ID required' }, { status: 400 });

  const deleted = await deleteReferral(id);
  if (!deleted) return NextResponse.json({ error: 'Referral not found' }, { status: 404 });

  return NextResponse.json({ success: true });
});
