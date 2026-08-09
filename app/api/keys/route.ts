import { NextResponse } from 'next/server';
import { withApi } from '@/lib/api/with-api';
import { listKeys } from '@/lib/services/key-service';
import { dataTablesQuerySchema } from '@/lib/utils/data-tables';

export const GET = withApi(async (request, user) => {
  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = dataTablesQuerySchema.parse(params);
  const result = await listKeys({
    draw: parsed.draw,
    start: parsed.start,
    length: parsed.length,
    search: parsed['search[value]'] || undefined,
    order: [{ column: parsed['order[0][column]'], dir: parsed['order[0][dir]'] }],
    registrator: user.level === 1 ? undefined : user.username,
  });
  return NextResponse.json(result);
});
