import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth/middleware';
import { listUsers } from '@/lib/services/user-service';
import { z } from 'zod/v4';
import { Logger } from '@/lib/utils';

const dataTablesQuery = z.object({
  draw: z.coerce.number().default(1),
  start: z.coerce.number().default(0),
  length: z.coerce.number().default(10),
  search: z.object({ value: z.string().default('') }).default({ value: '' }),
  order: z.array(z.object({ column: z.coerce.number(), dir: z.enum(['asc', 'desc']) })).default([{ column: 0, dir: 'desc' }]),
});

export async function GET(request: NextRequest) {
  const user = await authenticate(request);
  if (!user || user.level !== 1) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const params = Object.fromEntries(request.nextUrl.searchParams.entries());
    const parsed = dataTablesQuery.parse(params);
    const result = await listUsers({
      draw: parsed.draw,
      start: parsed.start,
      length: parsed.length,
      search: parsed.search.value,
      order: parsed.order,
    });
    return NextResponse.json(result);
  } catch (error) {
    Logger.error('Users list error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
