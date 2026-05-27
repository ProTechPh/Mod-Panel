import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth/middleware';
import { getLib, getLibLogs, getRecentLibLogs } from '@/lib/services/lib-service';

export async function GET(request: NextRequest) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const libId = request.nextUrl.searchParams.get('libId');

  if (libId) {
    const lib = await getLib(libId);
    if (!lib) return NextResponse.json({ error: 'Lib not found' }, { status: 404 });
    if (user.level !== 1 && lib.uploadedBy !== user.username) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const logs = await getLibLogs(libId, user.level === 1 ? undefined : user.username);
    return NextResponse.json(logs);
  }

  // No libId → return recent logs across all libs for this user
  const logs = await getRecentLibLogs(user.level === 1 ? undefined : user.username);
  return NextResponse.json(logs);
}
