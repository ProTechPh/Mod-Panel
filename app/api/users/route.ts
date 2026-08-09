import { NextResponse } from 'next/server';
import { withApi } from '@/lib/api/with-api';
import { listUsers } from '@/lib/services/user-service';
import { dataTablesQuerySchema } from '@/lib/utils/data-tables';

export const GET = withApi(async (request) => {
  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = dataTablesQuerySchema.parse(params);
  const result = await listUsers({
    draw: parsed.draw,
    start: parsed.start,
    length: parsed.length,
    search: parsed['search[value]'] || undefined,
    order: [{ column: parsed['order[0][column]'], dir: parsed['order[0][dir]'] }],
  });
  return NextResponse.json(result);
}, { level: 1 });
