import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth/middleware';
import { listAuditLogs } from '@/lib/services/audit-service';
import { Logger } from '@/lib/utils';

export async function GET(request: NextRequest) {
  const user = await authenticate(request);
  if (!user || user.level !== 1) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const params = Object.fromEntries(request.nextUrl.searchParams.entries());
    const result = await listAuditLogs({
      start: Number(params.start) || 0,
      length: Number(params.length) || 50,
      search: params['search[value]'] || undefined,
      action: params.action || undefined,
      actor: params.actor || undefined,
      startDate: params.startDate || undefined,
      endDate: params.endDate || undefined,
    });
    return NextResponse.json(result);
  } catch (error) {
    Logger.error('Audit log list error', { error: String(error) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
