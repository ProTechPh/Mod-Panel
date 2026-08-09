import { NextResponse } from 'next/server';
import { withApi } from '@/lib/api/with-api';
import { listAuditLogs } from '@/lib/services/audit-service';

export const GET = withApi(async (request) => {
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
}, { level: 1 });
