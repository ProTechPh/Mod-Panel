import { NextRequest, NextResponse } from 'next/server';
import { resetFreeKeyDevices } from '@/lib/services/free-key-service';
import { authenticate } from '@/lib/auth/middleware';
import { z } from 'zod/v4';

const schema = z.object({
  key: z.string().min(1, 'Key is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const user = await authenticate(request);
    if (!user?.username) {
      return NextResponse.json({ error: 'You must be logged in' }, { status: 401 });
    }

    const result = await resetFreeKeyDevices(parsed.data.key, user.username);

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Reset devices error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
