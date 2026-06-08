import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth/middleware';
import { sendNotification } from '@/lib/services/notification-service';

export async function POST(request: NextRequest) {
  const user = await authenticate(request);
  if (!user || user.level !== 1) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const result = await sendNotification('key.generated', {
    key: 'TEST-XXXX-1234',
    game: 'TestGame',
    duration: '7 days',
    generatedBy: user.username,
  });

  if (!result.sent) {
    return NextResponse.json({ success: false, error: 'No notification channels configured or no subscribers' }, { status: 200 });
  }

  return NextResponse.json({ success: true, channels: result.channels });
}
