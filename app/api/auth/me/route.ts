import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth/middleware';
import { getUser } from '@/lib/services/user-service';

export async function GET(request: NextRequest) {
  const authUser = await authenticate(request);
  if (!authUser) return NextResponse.json({ user: null }, { status: 401 });

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
}