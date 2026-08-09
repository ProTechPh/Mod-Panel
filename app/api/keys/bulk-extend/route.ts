import { NextResponse } from 'next/server';
import { withApi } from '@/lib/api/with-api';
import { bulkExtendKeys } from '@/lib/services/key-service';
import { bulkExtendSchema } from '@/lib/validators/key';

export const POST = withApi(async (request, user) => {
  if (user.level !== 1) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const body = await request.json();
  const parsed = bulkExtendSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
  }

  const { keyIds, additionalDays } = parsed.data;
  const count = await bulkExtendKeys(keyIds, additionalDays, user);
  return NextResponse.json({ success: true, extended: count });
});
