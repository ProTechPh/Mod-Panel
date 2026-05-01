import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth/middleware';
import { updateReferral, deleteReferral } from '@/lib/services/referral-service';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'Referral ID required' }, { status: 400 });

  try {
    const body = await request.json();
    const { level, setSaldo, accExpirationDays } = body;

    if (level === undefined && setSaldo === undefined && accExpirationDays === undefined) {
      return NextResponse.json({ error: 'At least one field required' }, { status: 400 });
    }

    const updated = await updateReferral(id, { level, setSaldo, accExpirationDays });
    if (!updated) return NextResponse.json({ error: 'Referral not found' }, { status: 404 });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update referral error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  if (user.level !== 1 && user.level !== 2) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'Referral ID required' }, { status: 400 });

  const deleted = await deleteReferral(id);
  if (!deleted) return NextResponse.json({ error: 'Referral not found' }, { status: 404 });

  return NextResponse.json({ success: true });
}
