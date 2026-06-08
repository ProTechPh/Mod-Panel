import { NextResponse } from 'next/server';
import { getAllActiveStores } from '@/lib/services/store-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const stores = await getAllActiveStores();
    return NextResponse.json(stores);
  } catch {
    return NextResponse.json({ error: 'Failed to load marketplace' }, { status: 500 });
  }
}
