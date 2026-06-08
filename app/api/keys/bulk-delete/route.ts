import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth/middleware';
import { bulkDelete, bulkDeleteByIds } from '@/lib/services/key-service';
import { bulkDeleteSchema } from '@/lib/validators/key';
import { logAudit } from '@/lib/services/audit-service';

export async function POST(request: NextRequest) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (user.level !== 1) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = bulkDeleteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
    }

    const data = parsed.data;
    let count: number;

    if ('ids' in data && data.ids) {
      count = await bulkDeleteByIds(data.ids);
    } else if ('filter' in data && data.filter) {
      count = await bulkDelete(data.filter, data.game);
    } else {
      return NextResponse.json({ error: 'Provide either filter or ids' }, { status: 400 });
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const target = 'filter' in data ? `filter:${data.filter}` : `ids:${data.ids.length}`;
    logAudit({ action: 'key.bulk_delete', actor: user.username, actorLevel: user.level, target, details: { deleted: count }, ip });

    return NextResponse.json({ success: true, deleted: count });
  } catch (error) {
    console.error('Bulk delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
