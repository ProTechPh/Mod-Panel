import { NextResponse } from 'next/server';
import { withApi } from '@/lib/api/with-api';
import { updateUser } from '@/lib/services/user-service';

export const POST = withApi(async (request, user) => {
  const body = await request.json();
  const { fullname } = body;

  if (!fullname) {
    return NextResponse.json({ error: 'Fullname is required' }, { status: 400 });
  }

  const updated = await updateUser(user.userId, { fullname });
  if (!updated) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  return NextResponse.json({ success: true, user: { fullname: updated.fullname } });
});
