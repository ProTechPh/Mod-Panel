import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth/middleware';
import { bulkExtendKeys } from '@/lib/services/key-service';
import { bulkExtendSchema } from '@/lib/validators/key';

export async function POST(request: NextRequest) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (user.level !== 1) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = bulkExtendSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
    }

    const { keyIds, additionalDays } = parsed.data;
    const count = await bulkExtendKeys(keyIds, additionalDays, user);
    return NextResponse.json({ success: true, extended: count });
  } catch (error) {
    console.error('Bulk extend error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
