import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth/middleware';
import { listKeys } from '@/lib/services/key-service';
import { z } from 'zod/v4';

const dataTablesQuery = z.object({
  draw: z.coerce.number().default(1),
  start: z.coerce.number().default(0),
  length: z.coerce.number().default(10),
  search: z.object({ value: z.string().default('') }).default({ value: '' }),
  order: z.array(z.object({ column: z.coerce.number(), dir: z.enum(['asc', 'desc']) })).default([{ column: 0, dir: 'desc' }]),
});

export async function GET(request: NextRequest) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const params = Object.fromEntries(request.nextUrl.searchParams.entries());
    const parsed = dataTablesQuery.parse(params);
    const result = await listKeys({
      draw: parsed.draw,
      start: parsed.start,
      length: parsed.length,
      search: parsed.search.value,
      order: parsed.order,
      registrator: user.level === 1 ? undefined : user.username,
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Keys list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
