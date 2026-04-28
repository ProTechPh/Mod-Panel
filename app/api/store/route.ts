import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth/middleware';
import { getStore, upsertStore } from '@/lib/services/store-service';

// GET /api/store?registrator=xxx  — public (for public store page)
// GET /api/store                   — authenticated (own store)
export async function GET(request: NextRequest) {
  const registratorParam = request.nextUrl.searchParams.get('registrator');

  if (registratorParam) {
    // Public access — return store info without auth
    const store = await getStore(registratorParam);
    if (!store || !store.isActive) return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    return NextResponse.json(store);
  }

  // Authenticated access — return own store
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.level !== 1 && user.level !== 2) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const store = await getStore(user.username);
  return NextResponse.json(store ?? null);
}

export async function POST(request: NextRequest) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.level !== 1 && user.level !== 2) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    if (!body.storeName?.trim()) return NextResponse.json({ error: 'Store name is required' }, { status: 400 });

    const store = await upsertStore(user.username, {
      storeName: body.storeName.trim(),
      storeDescription: body.storeDescription ?? '',
      isActive: body.isActive ?? true,
    });
    return NextResponse.json(store);
  } catch (error) {
    console.error('Store upsert error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
