import { NextResponse } from 'next/server';
import { withApi } from '@/lib/api/with-api';
import { changePassword } from '@/lib/services/user-service';

export const POST = withApi(async (request, user) => {
  const body = await request.json();
  const success = await changePassword(user.userId, body.currentPassword, body.newPassword);
  if (!success) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
  return NextResponse.json({ success: true });
});
