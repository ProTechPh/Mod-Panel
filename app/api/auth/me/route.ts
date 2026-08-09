import { NextResponse } from 'next/server';
import { withApi } from '@/lib/api/with-api';
import { getUser } from '@/lib/services/user-service';

// Returns `{ user: null }` (not `{ error }`) on 401 so the AuthProvider
// client can detect the logged-out state from the response body.
export const GET = withApi(async (request, authUser) => {
  const user = await getUser(authUser.userId);
  if (!user) return NextResponse.json({ user: null }, { status: 401 });

  return NextResponse.json({
    user: {
      userId: authUser.userId,
      username: authUser.username,
      level: authUser.level,
      fullname: user.fullname || '',
      saldo: user.saldo ?? 0,
    },
  });
}, { unauthorizedBody: { user: null } });
