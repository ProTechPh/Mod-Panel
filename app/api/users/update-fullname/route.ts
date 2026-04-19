import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth/middleware';
import { getUser, updateUser } from '@/lib/services/user-service';

export async function POST(request: NextRequest) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { fullname } = body;

    if (!fullname) {
      return NextResponse.json({ error: 'Fullname is required' }, { status: 400 });
    }

    const updated = await updateUser(user.userId, { fullname });
    if (!updated) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    return NextResponse.json({ success: true, user: { fullname: updated.fullname } });
  } catch (error) {
    console.error('Update fullname error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
